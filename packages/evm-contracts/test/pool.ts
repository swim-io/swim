/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import type { BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";

import { DEFAULTS, LOCAL } from "../src/config";
import { confirm, getProxy, getToken } from "../src/deploy";
import { deployment } from "../src/deployment";
import type { Pool } from "../typechain-types/contracts/Pool";
import type { ERC20Token } from "../typechain-types/contracts/test/ERC20Token";

use(require("chai-bn")(BN));

describe("Pool Defi Operations", function () {
  const liquidityProviderFunds = BigNumber.from(1e5);
  const baseAmount = BigNumber.from("10");
  const tolerance = 2;

  async function testFixture() {
    const [deployer, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();
    const governance = deployer;

    const tokenWrapper = async (contract: ERC20Token) => {
      const decimals = await contract.decimals();
      const address = contract.address;

      const toAtomic = (human: BigNumberish) =>
        parseFixed(typeof human === "string" ? human : human.toString(), decimals);

      const toHuman = (atomic: BigNumberish) => formatFixed(atomic, decimals);

      const balanceOf = (account: { readonly address: string }): Promise<BigNumber> =>
        contract.balanceOf(account.address);

      const totalSupply = (): Promise<BigNumber> => contract.totalSupply();

      const mint = (to: { readonly address: string }, amount: BigNumberish) =>
        confirm(contract.connect(deployer).mint(to.address, amount));

      const approve = (
        from: SignerWithAddress,
        to: { readonly address: string },
        amount: BigNumberish
      ) => confirm(contract.connect(from).approve(to.address, amount));

      const burn = (from: SignerWithAddress, amount: BigNumberish) =>
        confirm(contract.connect(from).burn(amount));

      return { contract, address, toAtomic, toHuman, balanceOf, totalSupply, mint, approve, burn };
    };

    await deployment();

    const pool = (await getProxy("Pool", LOCAL.pools[0].salt)) as Pool;
    const lpToken = await tokenWrapper(
      (await ethers.getContractAt("LpToken", await pool.getLpToken())) as ERC20Token
    );

    const tokenData = [DEFAULTS.swimUsd, ...LOCAL.tokens];
    const tokens = await Promise.all(
      tokenData.map(async (token, tokenNumber) =>
        Object.assign(await tokenWrapper((await getToken(token)) as ERC20Token), { tokenNumber })
      )
    );

    const toAtomicAmounts = (human: BigNumberish | readonly BigNumberish[]) =>
      tokens.map((t, i) => t.toAtomic(Array.isArray(human) ? human[i] : human));

    const defiOps = (() => {
      const call = (from: SignerWithAddress, method: string, args: readonly any[]) =>
        confirm((pool.connect(from) as Contract)[method](...args));

      const approveAll = (from: SignerWithAddress, amounts: readonly BigNumberish[]) =>
        Promise.all(
          tokens.map((token, i) =>
            BigNumber.from(amounts[i]).isZero()
              ? Promise.resolve()
              : token.approve(from, pool, amounts[i])
          )
        );

      const add = async (
        from: SignerWithAddress,
        inputAmounts: readonly BigNumberish[],
        minimumMintAmount: BigNumberish
      ) => {
        await approveAll(from, inputAmounts);
        return call(from, "add(uint256[],uint256)", [inputAmounts, minimumMintAmount]);
      };

      const removeUniform = async (
        from: SignerWithAddress,
        burnAmount: BigNumberish,
        minimumOutputAmounts: readonly BigNumberish[]
      ) => {
        await lpToken.approve(from, pool, burnAmount);
        return call(from, "removeUniform(uint256,uint256[])", [burnAmount, minimumOutputAmounts]);
      };

      const removeExactBurn = async (
        from: SignerWithAddress,
        burnAmount: BigNumberish,
        outputTokenIndex: number,
        minimumOutputAmount: BigNumberish
      ) => {
        await lpToken.approve(from, pool, burnAmount);
        return call(from, "removeExactBurn(uint256,uint8,uint256)", [
          burnAmount,
          outputTokenIndex,
          minimumOutputAmount,
        ]);
      };

      const removeExactOutput = async (
        from: SignerWithAddress,
        outputAmounts: readonly BigNumberish[],
        maximumBurnAmount: BigNumberish
      ) => {
        await lpToken.approve(from, pool, maximumBurnAmount);
        return call(from, "removeExactOutput(uint256[],uint256)", [
          outputAmounts,
          maximumBurnAmount,
        ]);
      };

      const swap = async (
        from: SignerWithAddress,
        inputAmount: BigNumberish,
        inputTokenIndex: number,
        outputTokenIndex: number,
        minimumOutputAmount: BigNumberish
      ) => {
        await tokens[inputTokenIndex].approve(from, pool, inputAmount);
        return call(from, "swap", [
          inputAmount,
          inputTokenIndex,
          outputTokenIndex,
          minimumOutputAmount,
        ]);
      };

      const swapExactInput = async (
        from: SignerWithAddress,
        inputAmounts: readonly BigNumberish[],
        outputTokenIndex: number,
        minimumOutputAmount: BigNumberish
      ) => {
        await approveAll(from, inputAmounts);
        return call(from, "swapExactInput", [inputAmounts, outputTokenIndex, minimumOutputAmount]);
      };

      const swapExactOutput = async (
        from: SignerWithAddress,
        maximumInputAmount: BigNumberish,
        inputTokenIndex: number,
        outputAmounts: readonly BigNumberish[]
      ) => {
        await tokens[inputTokenIndex].approve(from, pool, maximumInputAmount);
        return call(from, "swapExactOutput", [maximumInputAmount, inputTokenIndex, outputAmounts]);
      };

      return {
        add,
        removeUniform,
        removeExactBurn,
        removeExactOutput,
        swap,
        swapExactInput,
        swapExactOutput,
      };
    })();

    for (const token of tokens)
      await token.mint(liquidityProvider, token.toAtomic(liquidityProviderFunds));

    await defiOps.add(
      liquidityProvider,
      tokens.map((t) => t.toAtomic(baseAmount)),
      0
    );

    const [swimUSD, usdc, usdt] = tokens;
    await usdc.mint(user, usdc.toAtomic(1));

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      defiOps,
      swimUSD,
      usdc,
      usdt,
      lpToken,
      toAtomicAmounts,
    };
  }

  it("Check basic pool deployment parameters", async function () {
    const { pool, governance, liquidityProvider, lpToken } = await loadFixture(testFixture);

    expect(await pool.governance()).to.equal(governance.address);
    expect(await lpToken.contract.owner()).to.equal(pool.address);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(
      lpToken.toAtomic(baseAmount).mul(3)
    );
  });

  it("RemoveUniform should empty the pool and allow refilling after", async function () {
    const {
      defiOps,
      govFeeRecip,
      liquidityProvider,
      lpToken,
      swimUSD,
      usdc,
      usdt,
      toAtomicAmounts,
    } = await loadFixture(testFixture);

    const tokens = [swimUSD, usdc, usdt];

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await defiOps.removeUniform(liquidityProvider, lpAmount, toAtomicAmounts(baseAmount));

    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(0);
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds)
      );

    await defiOps.add(liquidityProvider, toAtomicAmounts(baseAmount), 0);
    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(
      lpToken.toAtomic(baseAmount).mul(3)
    );
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(
        token.toAtomic(liquidityProviderFunds.sub(baseAmount))
      );
  });

  it("Add should return correct outputs", async function () {
    const { defiOps, govFeeRecip, lpToken, user, toAtomicAmounts } = await loadFixture(testFixture);

    await defiOps.add(user, toAtomicAmounts([0, 1, 0]), 0);

    expect(await lpToken.balanceOf(user)).to.be.closeTo(lpToken.toAtomic("0.976045"), tolerance);
    expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(
      lpToken.toAtomic("0.000063"),
      tolerance
    );
  });

  it("RemoveExactBurn and RemoveExactOutput should return correct and consistent outputs", async function () {
    const setup = async () => {
      const { defiOps, govFeeRecip, lpToken, usdc, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      const expectedLp = lpToken.toAtomic("0.976045");
      const expectedUsdc = usdc.toAtomic("0.999495");
      const expectedGovFee = lpToken.toAtomic("0.000063");

      await defiOps.add(user, toAtomicAmounts([0, 1, 0]), 0);

      expect(await lpToken.balanceOf(user)).to.equal(expectedLp);
      const govFee = await lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await lpToken.contract.connect(govFeeRecip).transfer(miscAddress, govFee);
      return {
        expectedLp,
        expectedUsdc,
        expectedGovFee,
        defiOps,
        govFeeRecip,
        lpToken,
        usdc,
        user,
      };
    };

    {
      const {
        expectedLp,
        expectedUsdc,
        expectedGovFee,
        defiOps,
        govFeeRecip,
        lpToken,
        usdc,
        user,
      } = await setup();

      await defiOps.removeExactBurn(user, expectedLp, 1, 0);

      expect(await usdc.balanceOf(user)).to.be.closeTo(expectedUsdc, tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }

    {
      const {
        expectedLp,
        expectedUsdc,
        expectedGovFee,
        defiOps,
        govFeeRecip,
        lpToken,
        usdc,
        user,
      } = await setup();

      const outputAmount = expectedUsdc.sub(tolerance);
      await defiOps.removeExactOutput(user, [0, outputAmount, 0], expectedLp);

      expect(await usdc.balanceOf(user)).to.equal(outputAmount);
      expect(await lpToken.balanceOf(user)).to.be.closeTo(0, 2 * tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }
  });

  it("Swap equals SwapExactInput exactly", async function () {
    const swap = async () => {
      const { defiOps, govFeeRecip, lpToken, usdc, usdt, user } = await loadFixture(testFixture);

      await defiOps.swap(user, usdc.toAtomic(1), 1, 2, 0);
      return {
        swapUserUsdc: await usdt.balanceOf(user),
        swapGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapUserUsdc, swapGovFee } = await swap();

    const swapExactInput = async () => {
      const { defiOps, govFeeRecip, lpToken, usdt, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      await defiOps.swapExactInput(user, toAtomicAmounts([0, 1, 0]), 2, 0);
      return {
        swapExactInputUserUsdc: await usdt.balanceOf(user),
        swapExactInputGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapExactInputUserUsdc, swapExactInputGovFee } = await swapExactInput();

    expect(swapUserUsdc).to.equal(swapExactInputUserUsdc);
    expect(swapGovFee).to.equal(swapExactInputGovFee);
  });

  it("swapExactInput and SwapExactOutput should return correct and consistent outputs", async function () {
    const expectedUsdt = "0.929849";

    const swapExactInputGovFee = await (async () => {
      const { defiOps, govFeeRecip, lpToken, usdc, usdt, user, toAtomicAmounts } =
        await loadFixture(testFixture);

      await defiOps.swapExactInput(user, toAtomicAmounts([0, 1, 0]), 2, 0);

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.equal(0);
      expect(actualUsdt).to.be.closeTo(usdt.toAtomic(expectedUsdt), tolerance);

      return lpToken.balanceOf(govFeeRecip);
    })();

    const swapExactOutputGovFee = await (async () => {
      const { defiOps, govFeeRecip, lpToken, usdc, usdt, user } = await loadFixture(testFixture);

      const outputAmount = usdt.toAtomic(expectedUsdt).sub(tolerance);
      await defiOps.swapExactOutput(user, usdc.toAtomic(1), 1, [0, 0, outputAmount]);

      const remainingUsdc = await usdc.balanceOf(user);
      const actualUsdt = await usdt.balanceOf(user);

      expect(remainingUsdc).to.be.closeTo(0, 2 * tolerance);
      expect(actualUsdt).to.equal(outputAmount);

      return lpToken.balanceOf(govFeeRecip);
    })();

    expect(swapExactInputGovFee).to.be.closeTo(swapExactOutputGovFee, tolerance);
  });

  it("Check marginal prices are correct for stable swap", async function () {
    const { pool, defiOps, liquidityProvider, lpToken, toAtomicAmounts } = await loadFixture(
      testFixture
    );

    const expectedLpSupply = lpToken.toAtomic("16.749421");
    const expectedPrices = ["0.697954", "0.930605", "1.628559"].map((p) => parseFixed(p, 18));
    const priceTolerance = parseFixed("0.000001", 18);

    await defiOps.removeExactOutput(
      liquidityProvider,
      toAtomicAmounts([1, 4, 7]),
      lpToken.toAtomic(baseAmount).mul(3)
    );

    const actualLpSupply = await lpToken.totalSupply();
    const actualPrices = await pool.getMarginalPrices();
    expect(actualLpSupply).to.be.closeTo(expectedLpSupply, tolerance);
    for (let i = 0; i < expectedPrices.length; ++i)
      expect(actualPrices[i]).to.be.closeTo(expectedPrices[i], priceTolerance);

    await lpToken.burn(liquidityProvider, actualLpSupply.div(2));
    const doubledPrices = await pool.getMarginalPrices();
    for (let i = 0; i < doubledPrices.length; ++i)
      expect(doubledPrices[i]).to.be.closeTo(expectedPrices[i].mul(2), priceTolerance.mul(2));
  });

  it("Works for skewed swimUSD and LP", async function () {
    const { defiOps, liquidityProvider, lpToken, swimUSD, toAtomicAmounts } = await loadFixture(
      testFixture
    );

    const poolBalances = toAtomicAmounts(["0.879412", "2052.006916", "2117.774978"]);
    const lpSupply = lpToken.toAtomic("809.89675");
    const addSwimUsd = swimUSD.toAtomic("20");
    const expectedLp = lpToken.toAtomic("979.838246");

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await defiOps.removeUniform(liquidityProvider, lpAmount, toAtomicAmounts(baseAmount));

    await defiOps.add(liquidityProvider, poolBalances, 0);
    const rectifySupply = await lpToken.balanceOf(liquidityProvider);
    await lpToken.burn(liquidityProvider, rectifySupply.sub(lpSupply));
    await defiOps.add(liquidityProvider, [addSwimUsd, 0, 0], 0);
    const receivedLp = (await lpToken.balanceOf(liquidityProvider)).sub(lpSupply);
    expect(receivedLp).to.be.closeTo(expectedLp, tolerance);
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
