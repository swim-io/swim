import { expect } from "chai";
import { deployments, getNamedAccounts } from "hardhat";

describe("pool", function () {
  it("Should test the pool contract", async function () {
    const {fixture, get, execute, read} = deployments;
    const {deployer, governance, testLiquidityProvider, testUser} = await getNamedAccounts();
    await fixture(['PoolTest']);

    // const usdc = await get("USDC");
    // const usdt = await get("USDT");
    // const swimUsd = await get("swimUSD");
    const poolProxy = await get("PoolProxy");
    expect(await read("PoolProxy", {}, "governance")).to.equal(governance);
    expect(await read("LpTokenProxy", {}, "owner")).to.equal(poolProxy.address);

    // const one = BigInt("1" + "0".repeat(18));
    // await execute("USDC", {from: deployer}, "mint", testLiquidityProvider, BigInt(10)*one);
    // await execute("USDT", {from: deployer}, "mint", testLiquidityProvider, BigInt(10)*one);
    // await execute("swimUSD", {from: deployer}, "mint", testLiquidityProvider, BigInt(10)*one);

    // await execute("PoolProxy", {from: testLiquidityProvider}, "add", [BigInt(10)*one, BigInt(10)*one, BigInt(10)*one], 0);

    // await execute("USDC", {from: deployer}, "mint", testUser, one);
    // await execute("USDC", {from: testUser}, "swapExactInput", testUser, [one,0,0], 2, 0);
    // console.log("testUser USDT after swap:", await read("USDT", {}, "balanceOf", testUser));
  });
});
