//code in here should be rewritten to use ethers instead of hardhat-deploy to
// eliminate a bunch of boiler-plate etc and to make it generally more expressive

import { expect, use } from "chai";
import { deployments, getNamedAccounts, ethers } from "hardhat";
import { BN } from "bn.js";

use(require('chai-bn')(BN));

describe("Pool Defi Operations", function () {

  const toAtomic = ethers.utils.parseEther;
  const base = toAtomic("10");
  const tolerance = toAtomic("0.000002");

  const setupTest = deployments.createFixture(
    async ({deployments, getNamedAccounts}) => {
      await deployments.fixture();
      const {get, execute} = deployments;
      const {deployer, testLiquidityProvider, testUser} = await getNamedAccounts();
      const poolProxy = await get("PoolProxy");

      await execute("swimUSD", {from: deployer}, "mint", testLiquidityProvider, base);
      await execute("USDC", {from: deployer}, "mint", testLiquidityProvider, base);
      await execute("USDT", {from: deployer}, "mint", testLiquidityProvider, base);

      await execute("swimUSD", {from: testLiquidityProvider}, "approve", poolProxy.address, base);
      await execute("USDC", {from: testLiquidityProvider}, "approve", poolProxy.address, base);
      await execute("USDT", {from: testLiquidityProvider}, "approve", poolProxy.address, base);

      await execute("PoolProxy", {from: testLiquidityProvider}, "add", [base, base, base], 0);

      await execute("USDC", {from: deployer}, "mint", testUser, toAtomic("1"));
      await execute("USDC", {from: testUser}, "approve", poolProxy.address, toAtomic("1"));

      return {poolProxy: poolProxy.address};
    }
  );

  it("Check basic pool deployment parameters", async function () {
    const {read} = deployments;
    const {governance, testLiquidityProvider} = await getNamedAccounts();
    const {poolProxy} = await setupTest();

    expect(await read("PoolProxy", {}, "governance")).to.equal(governance);
    expect(await read("LpTokenProxy", {}, "owner")).to.equal(poolProxy);
    expect(await read("LpTokenProxy", {}, "balanceOf", testLiquidityProvider)).to.equal(base.mul(3));

    //console.log(JSON.stringify(await read("PoolProxy", {}, "getState"), null, 2));
  });

  it("RemoveUniform should empty the pool and allow refilling after", async function () {
    const {execute, read} = deployments;
    const {testLiquidityProvider, governanceFeeRecipient} = await getNamedAccounts();
    const {poolProxy} = await setupTest();

    await execute("LpTokenProxy", {from: testLiquidityProvider}, "approve", poolProxy, base.mul(3));
    await execute("PoolProxy", {from: testLiquidityProvider}, "removeUniform", base.mul(3), [base, base, base]);
    expect(await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient)).to.equal(0);
    expect(await read("LpTokenProxy", {}, "balanceOf", testLiquidityProvider)).to.equal(0);
    expect(await read("swimUSD", {}, "balanceOf", testLiquidityProvider)).to.equal(base);
    expect(await read("USDC", {}, "balanceOf", testLiquidityProvider)).to.equal(base);
    expect(await read("USDT", {}, "balanceOf", testLiquidityProvider)).to.equal(base);

    await execute("swimUSD", {from: testLiquidityProvider}, "approve", poolProxy, base);
    await execute("USDC", {from: testLiquidityProvider}, "approve", poolProxy, base);
    await execute("USDT", {from: testLiquidityProvider}, "approve", poolProxy, base);

    await execute("PoolProxy", {from: testLiquidityProvider}, "add", [base, base, base], 0);
    expect(await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient)).to.equal(0);
    expect(await read("LpTokenProxy", {}, "balanceOf", testLiquidityProvider)).to.equal(base.mul(3));
    expect(await read("swimUSD", {}, "balanceOf", testLiquidityProvider)).to.equal(0);
    expect(await read("USDC", {}, "balanceOf", testLiquidityProvider)).to.equal(0);
    expect(await read("USDT", {}, "balanceOf", testLiquidityProvider)).to.equal(0);
  });

  it("Add should return correct outputs", async function () {
    const {execute, read} = deployments;
    const {governanceFeeRecipient, testUser} = await getNamedAccounts();
    await setupTest();

    await execute("PoolProxy", {from: testUser}, "add", [0, toAtomic("1"), 0], 0);

    const userLpReceived = await read("LpTokenProxy", {}, "balanceOf", testUser);
    const governanceFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);

    expect(userLpReceived).to.be.closeTo(toAtomic("0.976045"), tolerance);
    expect(governanceFee).to.be.closeTo(toAtomic("0.000063"), tolerance);
  });

  it("RemoveExactBurn and RemoveExactOutput should return correct and consistent outputs", async function () {
    const {execute, read} = deployments;
    const {governanceFeeRecipient, testUser} = await getNamedAccounts();

    const expectedLp = toAtomic("0.976045");
    const expectedUsdc = toAtomic("0.999495");
    const expectedGovFee = toAtomic("0.000063");

    const specificSetup = async () => {
      const {poolProxy} = await setupTest();
      await execute("PoolProxy", {from: testUser}, "add", [0, toAtomic("1"), 0], 0);
      expect(await read("LpTokenProxy", {}, "balanceOf", testUser)).to.equal(expectedLp);
      await execute("LpTokenProxy", {from: testUser}, "approve", poolProxy, expectedLp);
      const govFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);
      //"flush" governance fee from first add for easier checking after
      const miscAddress = "0x" + "0".repeat(39) + "1";
      await execute("LpTokenProxy", {from: governanceFeeRecipient}, "transfer", miscAddress, govFee);
    };

    {
      await specificSetup();
      await execute("PoolProxy", {from: testUser}, "removeExactBurn", expectedLp, 1, 0);

      const actualUsdc = await read("USDC", {}, "balanceOf", testUser);
      const actualGovFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);

      expect(actualUsdc).to.be.closeTo(expectedUsdc, tolerance);
      expect(actualGovFee).to.be.closeTo(expectedGovFee, tolerance);
    }

    {
      await specificSetup();

      const outputAmount = expectedUsdc.sub(tolerance);
      await execute("PoolProxy", {from: testUser}, "removeExactOutput", [0, outputAmount, 0], expectedLp);

      const actualUsdc = await read("USDC", {}, "balanceOf", testUser);
      const userLpBalance = await read("LpTokenProxy", {}, "balanceOf", testUser);
      const actualGovFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);

      expect(actualUsdc).to.equal(outputAmount);
      expect(userLpBalance).to.be.closeTo(0, tolerance.mul(2));
      expect(actualGovFee).to.be.closeTo(expectedGovFee, tolerance);
    }
  });

  it("Swap equals SwapExactInput exactly", async function () {
    const {execute, read} = deployments;
    const {governanceFeeRecipient, testUser} = await getNamedAccounts();

    await setupTest();
    await execute("PoolProxy", {from: testUser}, "swap", toAtomic("1"), 1, 2, 0);
    const swapUserUsdc = await read("USDT", {}, "balanceOf", testUser);
    const swapGovFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);

    await setupTest();
    await execute("PoolProxy", {from: testUser}, "swapExactInput", [0, toAtomic("1"), 0], 2, 0);
    const swapExactInputUserUsdc = await read("USDT", {}, "balanceOf", testUser);
    const swapExactInputGovFee = await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);

    expect(swapUserUsdc).to.equal(swapExactInputUserUsdc);
    expect(swapGovFee).to.equal(swapExactInputGovFee);
  });

  it("swapExactInput and SwapExactOutput should return correct and consistent outputs", async function () {
    const {execute, read} = deployments;
    const {governanceFeeRecipient, testUser} = await getNamedAccounts();

    const expectedUsdt = toAtomic("0.929849");

    const swapExactInputGovFee = await (async() => {
      await setupTest();
      await execute("PoolProxy", {from: testUser}, "swapExactInput", [0, toAtomic("1"), 0], 2, 0);

      const remainingUsdc = await read("USDC", {}, "balanceOf", testUser);
      const actualUsdt = await read("USDT", {}, "balanceOf", testUser);

      expect(remainingUsdc).to.equal(0);
      expect(actualUsdt).to.be.closeTo(expectedUsdt, tolerance);

      return await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);
    })();

    const swapExactOutputGovFee = await (async() => {
      await setupTest();
      const outputAmount = expectedUsdt.sub(tolerance);
      await execute("PoolProxy", {from: testUser}, "swapExactOutput", toAtomic("1"), 1, [0, 0, outputAmount]);

      const remainingUsdc = await read("USDC", {}, "balanceOf", testUser);
      const actualUsdt = await read("USDT", {}, "balanceOf", testUser);

      expect(remainingUsdc).to.be.closeTo(0, tolerance.mul(2));
      expect(actualUsdt).to.equal(outputAmount);

      return await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient);
    })();

    expect(swapExactInputGovFee).to.be.closeTo(swapExactOutputGovFee, tolerance);
  });

  it("Check marginal prices gives correct results",async function () {
    const {execute, read} = deployments;
    const {testLiquidityProvider} = await getNamedAccounts();
    const {poolProxy} = await setupTest();

    const removeAmounts = ["1", "4", "7"].map((a) => toAtomic(a));
    const expectedLpSupply = toAtomic("16.749421");
    const expectedPrices = ["0.697954", "0.930605", "1.628559"].map((a) => toAtomic(a));

    await execute("LpTokenProxy", {from: testLiquidityProvider}, "approve", poolProxy, base.mul(3));
    await execute("PoolProxy", {from: testLiquidityProvider}, "removeExactOutput", removeAmounts, base.mul(3));
    const actualLpSupply = await read("LpTokenProxy", {}, "totalSupply");
    const actualPrices = await read("PoolProxy", {}, "getMarginalPrices");
    expect(actualLpSupply).to.be.closeTo(expectedLpSupply, tolerance);
    for (let i = 0; i < expectedPrices.length; ++i)
      expect(actualPrices[i]).to.be.closeTo(expectedPrices[i], tolerance);
  });
});
