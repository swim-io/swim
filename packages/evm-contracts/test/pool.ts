import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import { Contract, BigNumberish } from "ethers";
import { ethers } from "hardhat";

import { DEFAULTS, LOCAL } from "../src/config";
import { getProxy, getToken, confirm } from "../src/deploy";
import { deployment } from "../src/deployment";

use(require("chai-bn")(BN));

describe("Pool Defi Operations", function () {
  const baseAmount = BigNumber.from("10");
  const tolerance = 2;

  const defiOperations = (pool: Contract) => {
    const call = (from: SignerWithAddress, method: string, args: any[]) =>
      confirm(pool.connect(from)[method](...args));

    const add = (
      from: SignerWithAddress,
      inputAmounts: BigNumberish[],
      minimumMintAmount: BigNumberish,
    ) => call(from, "add(uint256[],uint256)", [inputAmounts, minimumMintAmount]);

    const removeUniform = (
      from: SignerWithAddress,
      burnAmount: BigNumberish,
      minimumOutputAmounts: BigNumberish[],
    ) => call(from, "removeUniform(uint256,uint256[])", [burnAmount, minimumOutputAmounts]);

    const removeExactBurn = (
      from: SignerWithAddress,
      burnAmount: BigNumberish,
      outputTokenIndex: number,
      minimumOutputAmount: BigNumberish,
    ) => call(
      from,
      "removeExactBurn(uint256,uint8,uint256)",
      [burnAmount, outputTokenIndex, minimumOutputAmount]
    );

    const removeExactOutput = (
      from: SignerWithAddress,
      outputAmounts: BigNumberish[],
      maximumBurnAmount: BigNumberish,
    ) => call(from, "removeExactOutput(uint256[],uint256)", [outputAmounts, maximumBurnAmount]);

    const swap = (
      from: SignerWithAddress,
      inputAmount: BigNumberish,
      inputTokenIndex: number,
      outputTokenIndex: number,
      minimumOutputAmount: BigNumberish,
    ) => call(from, "swap", [inputAmount, inputTokenIndex, outputTokenIndex, minimumOutputAmount]);

    const swapExactInput = (
      from: SignerWithAddress,
      inputAmounts: BigNumberish[],
      outputTokenIndex: number,
      minimumOutputAmount: BigNumberish,
    ) => call(from, "swapExactInput", [inputAmounts, outputTokenIndex, minimumOutputAmount]);

    const swapExactOutput = (
      from: SignerWithAddress,
      maximumInputAmount: BigNumberish,
      inputTokenIndex: number,
      outputAmounts: BigNumberish[],
    ) => call(from, "swapExactOutput", [maximumInputAmount, inputTokenIndex, outputAmounts]);

    return {
      add,
      removeUniform,
      removeExactBurn,
      removeExactOutput,
      swap,
      swapExactInput,
      swapExactOutput,
    };
  }

  async function testFixture() {
    const [deployer, governance, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();

    const tokenWrapper = async (contract: Contract) => {
      const decimals = (await contract.decimals()) as number;
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

      return { contract, address, toAtomic, toHuman, balanceOf, totalSupply, mint, approve };
    };

    await deployment();

    const tokenData = [DEFAULTS.swimUsd, ...LOCAL.tokens];
    const tokens = await Promise.all(
      tokenData.map(async (token, tokenNumber) =>
        Object.assign(await tokenWrapper(await getToken(token)), { tokenNumber })
      )
    );
    const [swimUSD, usdc, usdt] = tokens;

    const pool = await getProxy("Pool", LOCAL.pools[0].salt);
    const defiOps = defiOperations(pool);

    const lpToken = await tokenWrapper(
      await ethers.getContractAt("LpToken", await pool.getLpToken())
    );

    for (const token of tokens) {
      await token.mint(liquidityProvider, token.toAtomic(baseAmount));
      await token.approve(liquidityProvider, pool, token.toAtomic(baseAmount));
    }

    await defiOps.add(liquidityProvider, tokens.map((t) => t.toAtomic(baseAmount)), 0);

    await usdc.mint(user, usdc.toAtomic(1));
    await usdc.approve(user, pool, usdc.toAtomic(1));

    const toAtomicAmounts = (
      human: BigNumberish | readonly BigNumberish[]
    ) => tokens.map((t, i) => t.toAtomic(Array.isArray(human) ? human[i] : human));

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

    //console.log(JSON.stringify(await read("PoolProxy", {}, "getState"), null, 2));
  });

  it("RemoveUniform should empty the pool and allow refilling after", async function () {
    const { pool, defiOps, govFeeRecip, liquidityProvider, lpToken, swimUSD, usdc, usdt, toAtomicAmounts } =
      await loadFixture(testFixture);

    const tokens = [swimUSD, usdc, usdt];

    const lpAmount = lpToken.toAtomic(baseAmount).mul(3);
    await lpToken.approve(liquidityProvider, pool, lpAmount);
    await defiOps.removeUniform(liquidityProvider, lpAmount, toAtomicAmounts(baseAmount));

    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(0);
    for (const token of tokens)
      expect(await token.balanceOf(liquidityProvider)).to.equal(token.toAtomic(baseAmount));

    for (const token of tokens)
      await token.approve(liquidityProvider, pool, token.toAtomic(baseAmount));

    defiOps.add(liquidityProvider, toAtomicAmounts(baseAmount), 0);
    expect(await lpToken.balanceOf(govFeeRecip)).to.equal(0);
    expect(await lpToken.balanceOf(liquidityProvider)).to.equal(lpToken.toAtomic(baseAmount).mul(3));
    for (const token of tokens) expect(await token.balanceOf(liquidityProvider)).to.equal(0);
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
      const { pool, defiOps, govFeeRecip, lpToken, usdc, user, toAtomicAmounts } = await loadFixture(
        testFixture
      );

      const expectedLp = lpToken.toAtomic("0.976045");
      const expectedUsdc = usdc.toAtomic("0.999495");
      const expectedGovFee = lpToken.toAtomic("0.000063");

      await defiOps.add(user, toAtomicAmounts([0, 1, 0]), 0);

      expect(await lpToken.balanceOf(user)).to.equal(expectedLp);
      await lpToken.approve(user, pool, expectedLp);
      const govFee = await lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await lpToken.contract.connect(govFeeRecip).transfer(miscAddress, govFee);
      return { expectedLp, expectedUsdc, expectedGovFee, defiOps, govFeeRecip, lpToken, usdc, user };
    };

    {
      const { expectedLp, expectedUsdc, expectedGovFee, defiOps, govFeeRecip, lpToken, usdc, user } =
        await setup();

      await defiOps.removeExactBurn(user, expectedLp, 1, 0);

      expect(await usdc.balanceOf(user)).to.be.closeTo(expectedUsdc, tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }

    {
      const { expectedLp, expectedUsdc, expectedGovFee, defiOps, govFeeRecip, lpToken, usdc, user } =
        await setup();

      const outputAmount = expectedUsdc.sub(tolerance);
      await defiOps.removeExactOutput(user, [0, outputAmount, 0], expectedLp);

      expect(await usdc.balanceOf(user)).to.equal(outputAmount);
      expect(await lpToken.balanceOf(user)).to.be.closeTo(0, 2 * tolerance);
      expect(await lpToken.balanceOf(govFeeRecip)).to.be.closeTo(expectedGovFee, tolerance);
    }
  });

  it("Swap equals SwapExactInput exactly", async function () {
    const swap = async () => {
      const { defiOps, govFeeRecip, lpToken, usdc, usdt, user } =
        await loadFixture(testFixture);

      await defiOps.swap(user, usdc.toAtomic(1), 1, 2, 0);
      return {
        swapUserUsdc: await usdt.balanceOf(user),
        swapGovFee: await lpToken.balanceOf(govFeeRecip),
      };
    };

    const { swapUserUsdc, swapGovFee } = await swap();

    const swapExactInput = async () => {
      const { defiOps, govFeeRecip, lpToken, usdt, user, toAtomicAmounts } =
        await loadFixture(testFixture);

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
      const { defiOps, govFeeRecip, lpToken, usdc, usdt, user } = await loadFixture(
        testFixture
      );

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
    const { pool, defiOps, liquidityProvider, lpToken, toAtomicAmounts } = await loadFixture(testFixture);

    const expectedLpSupply = lpToken.toAtomic("16.749421");
    const expectedPrices = ["0.697954", "0.930605", "1.628559"].map((p) => parseFixed(p, 18));

    await lpToken.approve(liquidityProvider, pool, lpToken.toAtomic(baseAmount).mul(3));
    await defiOps.removeExactOutput(
      liquidityProvider,
      toAtomicAmounts([1, 4, 7]),
      lpToken.toAtomic(baseAmount).mul(3)
    );

    const actualLpSupply = await lpToken.totalSupply();
    const actualPrices = await pool.getMarginalPrices();
    expect(actualLpSupply).to.be.closeTo(expectedLpSupply, tolerance);
    for (let i = 0; i < expectedPrices.length; ++i)
      expect(actualPrices[i]).to.be.closeTo(expectedPrices[i], parseFixed("0.000001", 18));
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
