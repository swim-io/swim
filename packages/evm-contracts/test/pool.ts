import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { LOCAL } from "../src/config";
import { deployment } from "../src/deployment";
import type { HasAddress } from "../src/testUtils";
import { PoolWrapper, expectCloseTo, expectEqual, tolerance } from "../src/testUtils";
import type { LpToken } from "../typechain-types/contracts/LpToken";

describe("Pool Defi Operations", function () {
  const liquidityProviderFunds = 1e5;
  const baseAmount = 10;
  const userTokenIndex = 1;
  const userFunds = 1;

  async function testFixture() {
    await network.provider.send("hardhat_reset");
    const [deployer, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();
    const governance = deployer;

    await deployment({ ...LOCAL, routing: "MOCK" }, { print: false });

    const pool = await PoolWrapper.create(LOCAL.pools[0].salt);
    const { lpToken } = pool;

    for (const token of pool.tokens) await token.mint(liquidityProvider, liquidityProviderFunds);
    await pool.add(
      liquidityProvider,
      pool.tokens.map(() => baseAmount),
      0
    );
    await pool.tokens[userTokenIndex].mint(user, userFunds);

    const balancesOf = async (who: HasAddress) =>
      Promise.all(pool.tokens.map((token) => token.balanceOf(who)));

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      lpToken,
      balancesOf,
    };
  }

  it("Check basic pool deployment parameters", async function () {
    const { pool, lpToken, governance, govFeeRecip, liquidityProvider } = await loadFixture(
      testFixture
    );

    expect(await pool.contract.governance()).to.equal(governance.address);
    expect(await pool.contract.governanceFeeRecipient()).to.equal(govFeeRecip.address);
    expect(await (lpToken.contract as LpToken).owner()).to.equal(pool.address);
    await expectEqual(lpToken, liquidityProvider, baseAmount * pool.tokens.length);
  });

  it("removeUniform should empty the pool and allow refilling after", async function () {
    const { pool, lpToken, govFeeRecip, liquidityProvider } = await loadFixture(testFixture);

    const lpAmount = baseAmount * pool.tokens.length;
    await pool.removeUniform(
      liquidityProvider,
      lpAmount,
      pool.tokens.map(() => baseAmount)
    );

    await expectEqual(lpToken, govFeeRecip, 0);
    await expectEqual(lpToken, liquidityProvider, 0);
    for (const token of pool.tokens)
      await expectEqual(token, liquidityProvider, liquidityProviderFunds);

    await pool.add(
      liquidityProvider,
      pool.tokens.map(() => baseAmount),
      0
    );
    await expectEqual(lpToken, govFeeRecip, 0);
    await expectEqual(lpToken, liquidityProvider, baseAmount * pool.tokens.length);
    for (const token of pool.tokens)
      await expectEqual(token, liquidityProvider, liquidityProviderFunds - baseAmount);
  });

  it("add should return correct outputs", async function () {
    const { pool, lpToken, govFeeRecip, user, balancesOf } = await loadFixture(testFixture);

    const inputAmounts = pool.tokens.map((_, i) => (i === userTokenIndex ? userFunds : 0));
    const expected = (await pool.poolmath()).add(inputAmounts);
    const userBalancesBefore = await balancesOf(user);

    await pool.add(user, inputAmounts, 0);

    for (let i = 0; i < pool.tokens.length; ++i)
      await expectEqual(pool.tokens[i], user, userBalancesBefore[i].sub(inputAmounts[i]));

    await expectCloseTo(lpToken, user, expected.lpOutputAmount);
    await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);
  });

  it("removeExactBurn and removeExactOutput should return correct and consistent outputs", async function () {
    const outputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const setup = async () => {
      const { pool, lpToken, govFeeRecip, user, balancesOf } = await loadFixture(testFixture);

      const inputAmounts = pool.tokens.map((_, i) => (i === outputIndex ? inputAmount : 0));
      const expected = (await pool.poolmath()).add(inputAmounts);
      const userBalancesBefore = await balancesOf(user);

      await pool.add(user, inputAmounts, 0);

      for (let i = 0; i < pool.tokens.length; ++i)
        await expectEqual(pool.tokens[i], user, userBalancesBefore[i].sub(inputAmounts[i]));

      await expectCloseTo(lpToken, user, expected.lpOutputAmount);
      await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);

      const govFee = await lpToken.balanceOf(govFeeRecip);
      //"flush" governance fee from initial add for easier checking after
      const flush = { address: "0x" + "0".repeat(39) + "1" };
      await lpToken.transfer(govFeeRecip, flush, govFee);
      const userLp = await lpToken.balanceOf(user);
      return { pool, lpToken, govFeeRecip, user, userLp };
    };

    let expected;
    {
      const { pool, lpToken, govFeeRecip, user, userLp } = await setup();

      expected = (await pool.poolmath()).removeExactBurn(userLp, outputIndex);

      await pool.removeExactBurn(user, userLp, outputIndex, 0);

      await expectCloseTo(pool.tokens[outputIndex], user, expected.stableOutputAmount);
      await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);
    }

    {
      const { pool, lpToken, govFeeRecip, user, userLp } = await setup();

      const outputAmount = expected.stableOutputAmount.sub(tolerance);
      const outputAmounts = pool.tokens.map((_, i) => (i === outputIndex ? outputAmount : 0));

      await pool.removeExactOutput(user, outputAmounts, userLp);

      await expectEqual(pool.tokens[outputIndex], user, outputAmount);
      await expectCloseTo(lpToken, user, 0, 2);
      await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);
    }
  });

  it("swap equals swapExactInput exactly", async function () {
    const inputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const outputIndex = 2;

    const swapExactInput = await (async () => {
      const { pool, lpToken, govFeeRecip, user } = await loadFixture(testFixture);

      const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
      const expected = (await pool.poolmath()).swapExactInput(inputAmounts, outputIndex);

      await pool.swapExactInput(user, inputAmounts, outputIndex, 0);

      await expectCloseTo(pool.tokens[outputIndex], user, expected.stableOutputAmount);
      await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);

      return {
        stableAmount: await pool.tokens[outputIndex].balanceOf(user),
        govFeeAmount: await lpToken.balanceOf(govFeeRecip),
      };
    })();

    const { pool, lpToken, govFeeRecip, user } = await loadFixture(testFixture);

    await pool.swap(user, inputAmount, inputIndex, outputIndex, 0);

    await expectEqual(pool.tokens[outputIndex], user, swapExactInput.stableAmount);
    await expectEqual(lpToken, govFeeRecip, swapExactInput.govFeeAmount);
  });

  it("swapExactInput and swapExactOutput should return correct and consistent outputs", async function () {
    //const expectedUsdt = "0.929849";

    const inputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const outputIndex = 2;

    const swapExactInput = await (async () => {
      const { pool, lpToken, govFeeRecip, user } = await loadFixture(testFixture);

      const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
      const expected = (await pool.poolmath()).swapExactInput(inputAmounts, outputIndex);

      await pool.swapExactInput(user, inputAmounts, outputIndex, 0);

      await expectEqual(pool.tokens[inputIndex], user, 0);
      await expectCloseTo(pool.tokens[outputIndex], user, expected.stableOutputAmount);
      await expectCloseTo(lpToken, govFeeRecip, expected.governanceMintAmount);

      return {
        stableAmount: await pool.tokens[outputIndex].balanceOf(user),
        govFeeAmount: await lpToken.balanceOf(govFeeRecip),
      };
    })();

    const { pool, lpToken, govFeeRecip, user } = await loadFixture(testFixture);

    const outputAmount = swapExactInput.stableAmount.sub(tolerance);
    const outputAmounts = pool.tokens.map((_, i) => (i === outputIndex ? outputAmount : 0));

    await pool.swapExactOutput(user, inputAmount, inputIndex, outputAmounts);

    await expectEqual(pool.tokens[outputIndex], user, outputAmount);
    await expectCloseTo(pool.tokens[inputIndex], user, 0, 2);
    await expectCloseTo(lpToken, govFeeRecip, swapExactInput.govFeeAmount, 2);
  });

  it("Check marginal prices are correct for stable swap", async function () {
    const { pool, lpToken, liquidityProvider } = await loadFixture(testFixture);

    // const expectedLpSupply = lpToken.toAtomic("16.749421");
    // const marginalPriceDecimals = 18;
    // const expectedPrices = ["0.698014", "0.930686", "1.628701"].map((p) =>
    //   parseFixed(p, marginalPriceDecimals)
    // );
    // const priceTolerance = parseFixed("0.000001", marginalPriceDecimals);
    // const decimals = [swimUsd, usdc, usdt].map((t) => t.decimals);
    const removeAmounts = [1, 4, 7];

    await pool.removeExactOutput(liquidityProvider, removeAmounts, baseAmount * 3);

    const expected = (await pool.poolmath()).marginalPrices();

    const actualPrices = await pool.getMarginalPrices();
    for (let i = 0; i < pool.tokens.length; ++i)
      expect(expected[i].sub(actualPrices[i]).abs().lessThanOrEqualTo(tolerance));

    await lpToken.burn(liquidityProvider, (await lpToken.balanceOf(liquidityProvider)).div(2));
    const doubledPrices = await pool.getMarginalPrices();
    for (let i = 0; i < pool.tokens.length; ++i)
      expect(expected[i].mul(2).sub(doubledPrices[i]).abs().lessThanOrEqualTo(tolerance));
  });

  it("Works for skewed swimUsd and LP", async function () {
    const { pool, lpToken, liquidityProvider } = await loadFixture(testFixture);

    const poolBalances = ["0.879412", "2052.006916", "2117.774978"];
    const lpSupply = "809.89675";
    const inputIndex = 0;
    const inputAmount = "20";
    //const expectedLp = "979.838246";

    await pool.removeUniform(
      liquidityProvider,
      baseAmount * pool.tokens.length,
      pool.tokens.map(() => baseAmount)
    );

    await pool.add(liquidityProvider, poolBalances, 0);
    const rectifySupply = await lpToken.balanceOf(liquidityProvider);
    await lpToken.burn(liquidityProvider, rectifySupply.sub(lpSupply));

    const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
    const expected = (await pool.poolmath()).add(inputAmounts);

    await pool.add(liquidityProvider, inputAmounts, 0);
    //TODO figure out why this is less accurate than everything else
    await expectCloseTo(lpToken, liquidityProvider, expected.lpOutputAmount.add(lpSupply), 5);
  });

  // it("Check marginal prices are correct for constant product", async function () {
  //TODO
  // });
});
