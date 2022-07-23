import { expect } from "chai";
import { deployments, getNamedAccounts, ethers } from "hardhat";

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

    const toAtomic = ethers.utils.parseEther;
    const base = toAtomic("10");
    await execute("swimUSD", {from: deployer}, "mint", testLiquidityProvider, base);
    await execute("USDC", {from: deployer}, "mint", testLiquidityProvider, base);
    await execute("USDT", {from: deployer}, "mint", testLiquidityProvider, base);

    await execute("swimUSD", {from: testLiquidityProvider}, "approve", poolProxy.address, base);
    await execute("USDC", {from: testLiquidityProvider}, "approve", poolProxy.address, base);
    await execute("USDT", {from: testLiquidityProvider}, "approve", poolProxy.address, base);

    await execute("PoolProxy", {from: testLiquidityProvider}, "add", [base, base, base], 0);
    expect(await read("LpTokenProxy", {}, "balanceOf", testLiquidityProvider)).to.equal(base.mul(3));

    //console.log(JSON.stringify(await read("PoolProxy", {}, "getState"), null, 2));

    await execute("USDC", {from: deployer}, "mint", testUser, toAtomic("1"));
    await execute("USDC", {from: testUser}, "approve", poolProxy.address, toAtomic("1"));

    await execute("PoolProxy", {from: testUser}, "add", [0, toAtomic("1"), 0], 0);
    const expectedLp = toAtomic("0.976045");
    expect(await read("LpTokenProxy", {}, "balanceOf", testUser)).to.equal(expectedLp);
    expect(await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient)).to.equal(toAtomic("0.000063"));

    await execute("LpTokenProxy", {from: testUser}, "approve", poolProxy.address, expectedLp);

    // await execute("PoolProxy", {from: testUser}, "removeExactBurn", expectedLp, 1, 0);
    // expect(await read("LpTokenProxy", {}, "balanceOf", testUser)).to.equal(0);
    // expect(await read("USDC", {}, "balanceOf", testUser)).to.equal(toAtomic("0.999495"));
    // expect(await read("LpTokenProxy", {}, "balanceOf", governanceFeeRecipient)).to.equal(toAtomic("0.000063"));

    await execute("PoolProxy", {from: testUser}, "removeExactOutput", [0, toAtomic("0.999494"), 0], expectedLp);
    expect(await read("LpTokenProxy", {}, "balanceOf", testUser)).to.equal(0);
    expect(await read("USDC", {}, "balanceOf", testUser)).to.equal(toAtomic("0.999494"));

    // await execute("PoolProxy", {from: testUser}, "removeExactOutput", [0, toAtomic("0.999494"), 0], expectedLp);
    // expect(await read("LpTokenProxy", {}, "balanceOf", testUser)).to.equal(0);
    // expect(await read("USDC", {}, "balanceOf", testUser)).to.equal(toAtomic("0.999494"));

    // await execute("PoolProxy", {from: testUser}, "swap", toAtomic("1"), 1, 2, 0);
    // await execute("PoolProxy", {from: testUser}, "swapExactInput", [0, toAtomic("1"), 0], 2, 0);
    // expect(await read("USDT", {}, "balanceOf", testUser)).to.equal(toAtomic("0.929849"));

    // expect(await read("USDT", {}, "balanceOf", testUser)).to.equal(0);
    // expect(await read("USDC", {}, "balanceOf", testUser)).to.equal(toAtomic("1"));
    // await execute("PoolProxy", {from: testUser}, "swapExactOutput", toAtomic("1"), 1, [0, 0, toAtomic("0.929849")]);
    // expect(await read("USDT", {}, "balanceOf", testUser)).to.equal(toAtomic("0.929849"));
    // expect(await read("USDC", {}, "balanceOf", testUser)).to.equal(0);
  });
});
