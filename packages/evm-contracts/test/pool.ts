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
  const tolerance = 2;

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
      swimUsd,
      usdc,
      usdt,
    };
  }

  it("Check basic pool deployment parameters", async function () {
    const { pool, governance, liquidityProvider } = await loadFixture(testFixture);

    expect(await pool.contract.governance()).to.equal(governance.address);
    expect(await (pool.lpToken.contract as LpToken).owner()).to.equal(pool.address);
    expect(await pool.lpToken.balanceOf(liquidityProvider)).to.equal(
      pool.lpToken.toAtomic(baseAmount).mul(3)
    );
  });

  it("removeUniform should empty the pool and allow refilling after", async function () {
    const { pool, govFeeRecip, liquidityProvider, swimUsd, usdc, usdt } = await loadFixture(
      testFixture
    );

    const tokens = [swimUsd, usdc, usdt];

    const lpAmount = pool.lpToken.toAtomic(baseAmount).mul(3);
    await pool.removeUniform(liquidityProvider, lpAmount, pool.toAtomicAmounts(baseAmount));

    expect(await pool.lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await pool.lpToken.balanceOf(liquidityProvider)).to.equal(0);
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds)
      );

    await pool.add(liquidityProvider, pool.toAtomicAmounts(baseAmount), 0);
    expect(await pool.lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await pool.lpToken.balanceOf(liquidityProvider)).to.equal(
      pool.lpToken.toAtomic(baseAmount).mul(3)
    );
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds.sub(baseAmount))
      );
  });

  it("add should return correct outputs", async function () {
    const { pool, govFeeRecip, user } = await loadFixture(testFixture);

    const expectedUserLp = pool.lpToken.toAtomic("0.976045");
    const expectedGovFee = pool.lpToken.toAtomic("0.000063");

    await pool.add(user, pool.toAtomicAmounts([0, 1, 0]), 0);

    expect(await pool.lpToken.balanceOf(user)).to.be.closeTo(expectedUserLp, tolerance);
    expect(await pool.lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
  });

  it("removeExactBurn and removeExactOutput should return correct and consistent outputs", async function () {
    const setup = async () => {
      const { pool, govFeeRecip, usdc, user } = await loadFixture(testFixture);

      const expectedLp = pool.lpToken.toAtomic("0.976045");
      const expectedUsdc = usdc.toAtomic("0.999495");
      const expectedGovFee = pool.lpToken.toAtomic("0.000063");

      await pool.add(user, pool.toAtomicAmounts([0, 1, 0]), 0);

      expect(await pool.lpToken.balanceOf(user)).to.equal(expectedLp);
      const govFee = await pool.lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await pool.lpToken.contract.connect(govFeeRecip).transfer(miscAddress, govFee);
      return {
        expectedLp,
        expectedUsdc,
        expectedGovFee,
        pool,
        govFeeRecip,
        usdc,
        user,
      };
    };

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, govFeeRecip, usdc, user } =
        await setup();

      await pool.removeExactBurn(user, expectedLp, 1, 0);

      expect(await usdc.balanceOf(user)).to.be.closeTo(expectedUsdc, tolerance);
      expect(await pool.lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }

    {
      const { expectedLp, expectedUsdc, expectedGovFee, pool, govFeeRecip, usdc, user } =
        await setup();

      const outputAmount = expectedUsdc.sub(tolerance);
      await pool.removeExactOutput(user, [0, outputAmount, 0], expectedLp);

      expect(await usdc.balanceOf(user)).to.equal(outputAmount);
      expect(await pool.lpToken.balanceOf(user)).to.be.closeTo(0, 2 * tolerance);
      expect(await pool.lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }
  });

  it("swap equals swapExactInput exactly", async function () {
    const swap = async () => {
      const { pool, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

      await pool.swap(user, usdc.toAtomic(1), 1, 2, 0);
      return {
        swapUserUsdc: await usdt.balanceOf(user),
        swapGovFee: await pool.lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapUserUsdc, swapGovFee } = await swap();

    const swapExactInput = async () => {
      const { pool, govFeeRecip, usdt, user } = await loadFixture(testFixture);

      await pool.swapExactInput(user, pool.toAtomicAmounts([0, 1, 0]), 2, 0);
      return {
        swapExactInputUserUsdc: await usdt.balanceOf(user),
        swapExactInputGovFee: await pool.lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapExactInputUserUsdc, swapExactInputGovFee } = await swapExactInput();

    expect(swapUserUsdc).to.equal(swapExactInputUserUsdc);
    expect(swapGovFee).to.equal(swapExactInputGovFee);
  });

  it("swapExactInput and swapExactOutput should return correct and consistent outputs", async function () {
    const expectedUsdt = "0.929849";

    const swapExactInputGovFee = await (async () => {
      const { pool, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

      await pool.swapExactInput(user, pool.toAtomicAmounts([0, 1, 0]), 2, 0);

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.equal(0);
      expect(actualUsdt).to.be.closeTo(usdt.toAtomic(expectedUsdt), tolerance);

      return pool.lpToken.balanceOf(govFeeRecip);
    })();

    const swapExactOutputGovFee = await (async () => {
      const { pool, govFeeRecip, usdc, usdt, user } = await loadFixture(testFixture);

      const outputAmount = usdt.toAtomic(expectedUsdt).sub(tolerance);
      await pool.swapExactOutput(user, usdc.toAtomic(1), 1, [0, 0, outputAmount]);

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.be.closeTo(0, 2 * tolerance);
      expect(actualUsdt).to.equal(outputAmount);

      return pool.lpToken.balanceOf(govFeeRecip);
    })();

    expect(swapExactInputGovFee).to.be.closeTo(swapExactOutputGovFee, tolerance);
  });

  it("Check marginal prices are correct for stable swap", async function () {
    const { pool, liquidityProvider } = await loadFixture(testFixture);

    const expectedLpSupply = pool.lpToken.toAtomic("16.749421");
    const expectedPrices = ["0.698014", "0.930686", "1.628701"].map((p) => parseFixed(p, 18));
    const priceTolerance = parseFixed("0.000001", 18);

    await pool.removeExactOutput(
      liquidityProvider,
      pool.toAtomicAmounts([1, 4, 7]),
      pool.lpToken.toAtomic(baseAmount).mul(3)
    );

    const actualLpSupply = await pool.lpToken.totalSupply();
    const actualPrices = await pool.contract.getMarginalPrices();
    expect(actualLpSupply).to.be.closeTo(expectedLpSupply, tolerance);
    for (let i = 0; i < expectedPrices.length; ++i)
      expect(actualPrices[i]).to.be.closeTo(expectedPrices[i], priceTolerance);

    await pool.lpToken.burn(liquidityProvider, actualLpSupply.div(2));
    const doubledPrices = await pool.contract.getMarginalPrices();
    for (let i = 0; i < doubledPrices.length; ++i)
      expect(doubledPrices[i]).to.be.closeTo(expectedPrices[i].mul(2), priceTolerance.mul(2));
  });

  it("Works for skewed swimUsd and LP", async function () {
    const { pool, liquidityProvider, swimUsd } = await loadFixture(testFixture);

    const poolBalances = pool.toAtomicAmounts(["0.879412", "2052.006916", "2117.774978"]);
    const lpSupply = pool.lpToken.toAtomic("809.89675");
    const addswimUsd = swimUsd.toAtomic("20");
    const expectedLp = pool.lpToken.toAtomic("979.838246");

    const lpAmount = pool.lpToken.toAtomic(baseAmount).mul(3);
    await pool.removeUniform(liquidityProvider, lpAmount, pool.toAtomicAmounts(baseAmount));

    await pool.add(liquidityProvider, poolBalances, 0);
    const rectifySupply = await pool.lpToken.balanceOf(liquidityProvider);
    await pool.lpToken.burn(liquidityProvider, rectifySupply.sub(lpSupply));
    await pool.add(liquidityProvider, [addswimUsd, 0, 0], 0);
    const receivedLp = (await pool.lpToken.balanceOf(liquidityProvider)).sub(lpSupply);
    expect(receivedLp).to.be.closeTo(expectedLp, tolerance);
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
