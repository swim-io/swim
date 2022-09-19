/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber, parseFixed } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import { ethers, network } from "hardhat";

import { LOCAL } from "../src/config";
import { getRoutingProxy, getToken } from "../src/deploy";
import { deployment } from "../src/deployment";
import { PoolWrapper, TokenWrapper } from "../src/testUtils";
import type { LpToken } from "../typechain-types/contracts/LpToken";

use(require("chai-bn")(BN));

describe("Pool Defi Operations", function () {
  const liquidityProviderFunds = BigNumber.from(1e5);
  const baseAmount = BigNumber.from("10");
  const tolerance = (token: TokenWrapper) => token.toAtomic("0.000002");

  const asAtomic = (token: TokenWrapper, val: string | BigNumber | number) =>
    typeof val === "string" ? token.toAtomic(val) : val;

  function expectCloseTo(
    token: TokenWrapper,
    actual: string | BigNumber | number,
    expected: string | BigNumber | number,
    toleranceMultiplier = 1
  ) {
    expect(asAtomic(token, actual)).to.be.closeTo(
      asAtomic(token, expected),
      tolerance(token).mul(toleranceMultiplier)
    );
  }

  async function testFixture() {
    await network.provider.send("hardhat_reset");
    const [deployer, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();
    const governance = deployer;

    await deployment({ ...LOCAL, routing: "MOCK" }, { print: false });

    const swimUsd = await TokenWrapper.create(
      await ethers.getContractAt("ERC20Token", await (await getRoutingProxy()).swimUsdAddress())
    );

    const [usdc, usdt] = await Promise.all(
      LOCAL.pools[0].tokens.map(async (token) => await TokenWrapper.create(await getToken(token)))
    );

    const pool = await PoolWrapper.create(LOCAL.pools[0].salt, [swimUsd, usdc, usdt]);
    const { lpToken } = pool;

    for (const token of pool.tokens)
      await token.mint(liquidityProvider, token.toAtomic(liquidityProviderFunds));

    await pool.add(liquidityProvider, pool.toAtomicAmounts(baseAmount), 0);
    await usdc.mint(user, usdc.toAtomic(1));

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      lpToken,
      swimUsd,
      usdc,
      usdt,
    };
  }

  it("Check basic pool deployment parameters", async function () {
    const { pool, lpToken, governance, liquidityProvider } = await loadFixture(testFixture);

    expect(await pool.contract.governance()).to.equal(governance.address);
    expect(await (lpToken.contract as LpToken).owner()).to.equal(pool.address);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(
      lpToken.toAtomic(baseAmount).mul(3)
    );
  });

  it("removeUniform should empty the pool and allow refilling after", async function () {
    const { pool, lpToken, govFeeRecip, liquidityProvider, swimUsd, usdc, usdt } =
      await loadFixture(testFixture);

    const tokens = [swimUsd, usdc, usdt];

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await pool.removeUniform(liquidityProvider, lpAmount, pool.toAtomicAmounts(baseAmount));

    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(0);
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds)
      );

    await pool.add(liquidityProvider, pool.toAtomicAmounts(baseAmount), 0);
    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(
      lpToken.toAtomic(baseAmount).mul(3)
    );
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds.sub(baseAmount))
      );
  });

  it("add should return correct outputs", async function () {
    const { pool, lpToken, govFeeRecip, user } = await loadFixture(testFixture);

    const expectedUserLp = "0.976045";
    const expectedGovFee = "0.000063";

    await pool.add(user, pool.toAtomicAmounts([0, 1, 0]), 0);

    expectCloseTo(lpToken, await lpToken.balanceOf(user), expectedUserLp);
    expectCloseTo(lpToken, await lpToken.balanceOf(govFeeRecip), expectedGovFee);
  });

  it("removeExactBurn and removeExactOutput should return correct and consistent outputs", async function () {
    const setup = async () => {
      const { pool, lpToken, govFeeRecip, usdc, user } = await loadFixture(testFixture);

      const expectedLp = lpToken.toAtomic("0.976046");
      const expectedUsdc = usdc.toAtomic("0.999495");
      const expectedGovFee = lpToken.toAtomic("0.000063");

      await pool.add(user, pool.toAtomicAmounts([0, 1, 0]), 0);

      expect(await lpToken.balanceOf(user)).to.equal(expectedLp);
      const govFee = await lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await lpToken.contract.connect(govFeeRecip).transfer(miscAddress, govFee);
      return {
        expectedLp,
        expectedUsdc,
        expectedGovFee,
        pool,
        lpToken,
        govFeeRecip,
        usdc,
        user,
      };
    };

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, lpToken, govFeeRecip, usdc, user } =
        await setup();

      await pool.removeExactBurn(user, expectedLp, 1, 0);

      expectCloseTo(usdc, await usdc.balanceOf(user), expectedUsdc);
      expectCloseTo(lpToken, await lpToken.balanceOf(govFeeRecip), expectedGovFee);
    }

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, lpToken, govFeeRecip, usdc, user } =
        await setup();

      const outputAmount = expectedUsdc.sub(tolerance(usdc));
      await pool.removeExactOutput(user, [0, outputAmount, 0], expectedLp);

      expect(await usdc.balanceOf(user)).to.equal(outputAmount);
      expectCloseTo(lpToken, await lpToken.balanceOf(user), 0, 2);
      expectCloseTo(lpToken, await lpToken.balanceOf(govFeeRecip), expectedGovFee);
    }
  });

  it("swap equals swapExactInput exactly", async function () {
    const swap = async () => {
      const { pool, lpToken, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

      await pool.swap(user, usdc.toAtomic(1), 1, 2, 0);
      return {
        swapUserUsdc: await usdt.balanceOf(user),
        swapGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapUserUsdc, swapGovFee } = await swap();

    const swapExactInput = async () => {
      const { pool, lpToken, govFeeRecip, usdt, user } = await loadFixture(testFixture);

      await pool.swapExactInput(user, pool.toAtomicAmounts([0, 1, 0]), 2, 0);
      return {
        swapExactInputUserUsdc: await usdt.balanceOf(user),
        swapExactInputGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapExactInputUserUsdc, swapExactInputGovFee } = await swapExactInput();

    expect(swapUserUsdc).to.equal(swapExactInputUserUsdc);
    expect(swapGovFee).to.equal(swapExactInputGovFee);
  });

  it("swapExactInput and swapExactOutput should return correct and consistent outputs", async function () {
    const expectedUsdt = "0.929849";

    const swapExactInputGovFee = await (async () => {
      const { pool, lpToken, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

      await pool.swapExactInput(user, pool.toAtomicAmounts([0, 1, 0]), 2, 0);

      expect(await usdc.balanceOf(user)).to.equal(0);
      expectCloseTo(usdt, await usdt.balanceOf(user), expectedUsdt);

      return lpToken.balanceOf(govFeeRecip);
    })();

    const { pool, lpToken, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

    const outputAmount = usdt.toAtomic(expectedUsdt).sub(tolerance(usdt));
    await pool.swapExactOutput(user, usdc.toAtomic(1), 1, [0, 0, outputAmount]);

    const remainingUsdc = await usdc.balanceOf(user);
    const actualUsdt = await usdt.balanceOf(user);

    expectCloseTo(usdc, remainingUsdc, 0, 2);
    expect(actualUsdt).to.equal(outputAmount);

    expectCloseTo(lpToken, await lpToken.balanceOf(govFeeRecip), swapExactInputGovFee);
  });

  it("Check marginal prices are correct for stable swap", async function () {
    const { pool, lpToken, liquidityProvider, swimUsd, usdc, usdt } = await loadFixture(
      testFixture
    );

    const expectedLpSupply = lpToken.toAtomic("16.749421");
    const marginalPriceDecimals = 18;
    const expectedPrices = ["0.698014", "0.930686", "1.628701"].map((p) =>
      parseFixed(p, marginalPriceDecimals)
    );
    const priceTolerance = parseFixed("0.000001", marginalPriceDecimals);
    const decimals = [swimUsd, usdc, usdt].map((t) => t.decimals);

    await pool.removeExactOutput(
      liquidityProvider,
      pool.toAtomicAmounts([1, 4, 7]),
      lpToken.toAtomic(baseAmount).mul(3)
    );

    const actualLpSupply = await lpToken.totalSupply();
    //test against the internal function, rather than the convenience function
    const actualPrices = await pool.contract.getMarginalPrices();
    expectCloseTo(lpToken, actualLpSupply, expectedLpSupply);
    for (let i = 0; i < expectedPrices.length; ++i) {
      expect(actualPrices[i].value).to.be.closeTo(expectedPrices[i], priceTolerance);
      expect(actualPrices[i].decimals).to.equal(
        marginalPriceDecimals + decimals[i] - lpToken.decimals
      );
    }

    await lpToken.burn(liquidityProvider, actualLpSupply.div(2));
    const doubledPrices = await pool.contract.getMarginalPrices();
    for (let i = 0; i < doubledPrices.length; ++i) {
      expect(doubledPrices[i].value).to.be.closeTo(expectedPrices[i].mul(2), priceTolerance.mul(2));
      expect(doubledPrices[i].decimals).to.equal(
        marginalPriceDecimals + decimals[i] - lpToken.decimals
      );
    }
  });

  it("Works for skewed swimUsd and LP", async function () {
    const { pool, lpToken, liquidityProvider, swimUsd } = await loadFixture(testFixture);

    const poolBalances = pool.toAtomicAmounts(["0.879412", "2052.006916", "2117.774978"]);
    const lpSupply = lpToken.toAtomic("809.89675");
    const addswimUsd = swimUsd.toAtomic("20");
    const expectedLp = lpToken.toAtomic("979.838246");

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await pool.removeUniform(liquidityProvider, lpAmount, pool.toAtomicAmounts(baseAmount));

    await pool.add(liquidityProvider, poolBalances, 0);
    const rectifySupply = await lpToken.balanceOf(liquidityProvider);
    await lpToken.burn(liquidityProvider, rectifySupply.sub(lpSupply));
    await pool.add(liquidityProvider, [addswimUsd, 0, 0], 0);
    const receivedLp = (await lpToken.balanceOf(liquidityProvider)).sub(lpSupply);
    expectCloseTo(lpToken, receivedLp, expectedLp);
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
