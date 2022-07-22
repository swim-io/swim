import { expect } from "chai";
import { deployments, getNamedAccounts } from "hardhat";

describe("pool", function () {
  it("Should test the pool contract", async function () {
    const {fixture, get, execute, read} = deployments;
    const {deployer, governance, governanceFeeRecipient, testLiquidityProvider, testUser} = await getNamedAccounts();
    await fixture(['PoolTest']);

    // const usdc = await get("USDC");
    // const usdt = await get("USDT");
    // const swimUsd = await get("swimUSD");
    const poolProxy = await get("PoolProxy");
    expect(await read("PoolProxy", {}, "governance")).to.equal(governance);
    expect(await read("LpTokenProxy", {}, "owner")).to.equal(poolProxy.address);

    const one = BigInt("1" + "0".repeat(18));
    const ten = BigInt(10)*one;
    await execute("USDC", {from: deployer}, "mint", testLiquidityProvider, ten);
    await execute("USDT", {from: deployer}, "mint", testLiquidityProvider, ten);
    await execute("swimUSD", {from: deployer}, "mint", testLiquidityProvider, ten);

    await execute("USDC", {from: testLiquidityProvider}, "approve", poolProxy.address, ten);
    await execute("USDT", {from: testLiquidityProvider}, "approve", poolProxy.address, ten);
    await execute("swimUSD", {from: testLiquidityProvider}, "approve", poolProxy.address, ten);

    await execute("PoolProxy", {from: testLiquidityProvider}, "add", [ten, ten, ten], 0);
    expect(await read("LpTokenProxy", {}, "balanceOf", testLiquidityProvider)).to.equal(BigInt(3)*ten);

    console.log(JSON.stringify(await read("PoolProxy", {}, "getState"), null, 2));

    await execute("USDC", {from: deployer}, "mint", testUser, one);
    await execute("USDC", {from: testUser}, "approve", poolProxy.address, one);
    await execute("PoolProxy", {from: testUser}, "add", [0, one, 0], 0);
    console.log("testUser LP after add:", (await read("LpTokenProxy", {}, "balanceOf", testUser)).toString());
    console.log("govFeeRecipient LP after add:", (await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient)).toString());
    // await execute("PoolProxy", {from: testUser}, "swap", one, 1, 2, 0);
    // console.log("testUser USDT after swap:", (await read("USDT", {}, "balanceOf", testUser)).toString());
  });
});
