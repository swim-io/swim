/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber, parseFixed } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import { ethers, network } from "hardhat";

import { LOCAL, SWIM_USD_SOLANA_ADDRESS, WORMHOLE_SOLANA_CHAIN_ID } from "../src/config";
import { getRegular, getRoutingProxy, getToken } from "../src/deploy";
import { deployment } from "../src/deployment";
import { CoreBridgeMessage, decodeVaa, SwimPayload, TokenBridgePayload } from "../src/payloads";
import { PoolWrapper, RoutingWrapper, TokenWrapper } from "../src/testUtils";
import type { IWormhole } from "../typechain-types/contracts/interfaces/IWormhole";

use(require("chai-bn")(BN));

describe("Routing CrossChain and Propeller Defi Operations", function () {
  const liquidityProviderFunds = BigNumber.from(1e5);
  const baseAmount = BigNumber.from("10");
  const tolerance = 2;
  const memo = Buffer.from("00".repeat(15) + "01", "hex");
  const targetChain = 37; //some random number that's not 1 (== WORMHOLE_SOLANA_CHAIN_ID)

  async function testFixture() {
    //for some reason we need to reset, otherwise Pool and Routing test suites interfere...
    await network.provider.send("hardhat_reset");
    const [deployer, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();
    const governance = deployer;

    await deployment(LOCAL, { print: false });

    const routingProxy = new RoutingWrapper(await getRoutingProxy());

    const swimUsd = await TokenWrapper.create(
      await ethers.getContractAt("ERC20Token", await routingProxy.contract.swimUsdAddress())
    );

    const [usdc, usdt] = await Promise.all(
      LOCAL.pools[0].tokens.map(async (token) => await TokenWrapper.create(await getToken(token)))
    );

    const pool = await PoolWrapper.create(LOCAL.pools[0].salt, [swimUsd, usdc, usdt]);

    for (const token of pool.tokens)
      await token.mint(liquidityProvider, token.toAtomic(liquidityProviderFunds));

    await pool.add(liquidityProvider, pool.toAtomicAmounts(baseAmount), 0);
    await usdc.mint(user, usdc.toAtomic(1));

    const wormhole = (await getRegular("MockWormhole", [])) as IWormhole;
    const getWormholeEvents = async () =>
      wormhole.queryFilter(wormhole.filters.LogMessagePublished());
    const tokenBridge = await getRegular("MockTokenBridge", [wormhole.address]);
    const createFakeVaa = (amount: BigNumber, swimPayload: SwimPayload) => {
      const tokenBridgePayload = new TokenBridgePayload(
        3, //payloadId 1 == transfer, 3 == transferWithPayload
        amount.toBigInt(),
        SWIM_USD_SOLANA_ADDRESS.slice(2),
        WORMHOLE_SOLANA_CHAIN_ID,
        asBytes32String(routingProxy.address),
        targetChain,
        asBytes32String(tokenBridge.address),
        swimPayload.encode()
      );
      //all values here are ignored by MockWormhole and thus chosen essentially arbitrarily
      const coreBridgeMessage = new CoreBridgeMessage(
        1, //version
        0, //guardianSetIndex
        [], //signatures
        0, //timestamp
        0, //nonce
        0, //emitterChain
        asBytes32String(routingProxy.address), //emitterAddress
        BigInt(0), //sequence
        15, //consistencyLevel
        tokenBridgePayload.encode()
      );
      return coreBridgeMessage.encode();
    };

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      routingProxy,
      getWormholeEvents,
      createFakeVaa,
      swimUsd,
      usdc,
      usdt,
    };
  }

  const asBytes32String = (address: string) => "00".repeat(12) + address.slice(2).toLowerCase();

  it("onChainSwap should return correct outputs", async function () {
    const { routingProxy, user, usdc, usdt } = await loadFixture(testFixture);
    const expectedUsdt = usdt.toAtomic("0.929849");

    await routingProxy.onChainSwap(user, usdc, usdc.toAtomic(1), user, usdt, 0);

    const remainingUsdc = await usdc.balanceOf(user);
    const actualUsdt = await usdt.balanceOf(user);

    expect(remainingUsdc).to.equal(0);
    expect(actualUsdt).to.be.closeTo(expectedUsdt, tolerance);
  });

  it("crossChainInitiate", async function () {
    const { routingProxy, getWormholeEvents, user, usdc, swimUsd } = await loadFixture(testFixture);

    const expectedSwimUsd = swimUsd.toAtomic("0.929849");
    const recipient = user;

    await routingProxy.crossChainInitiate(
      user,
      usdc,
      usdc.toAtomic(1),
      0,
      targetChain,
      recipient,
      memo
    );
    expect((await routingProxy.getMemoInteractionEvents(memo)).length).to.equal(1);
    const wormholeEvents = await getWormholeEvents();
    expect(wormholeEvents.length).to.equal(1);
    const tokenBridgePayload = TokenBridgePayload.decode(
      Buffer.from(wormholeEvents[0].args[3].slice(2), "hex")
    );
    expect(tokenBridgePayload.amount).to.be.closeTo(expectedSwimUsd, tolerance);
    expect(tokenBridgePayload.originAddress).to.equal(SWIM_USD_SOLANA_ADDRESS.slice(2));
    expect(tokenBridgePayload.originChain).to.equal(WORMHOLE_SOLANA_CHAIN_ID);
    expect(tokenBridgePayload.targetAddress).to.equal(asBytes32String(routingProxy.address));
    expect(tokenBridgePayload.targetChain).to.equal(targetChain);

    const swimPayload = SwimPayload.decode(tokenBridgePayload.extraPayload);
    expect(swimPayload.version).to.equal(1);
    expect(swimPayload.toOwner).to.equal(asBytes32String(recipient.address));
  });

  it("crossChainComplete - bridge only", async function () {
    const { routingProxy, createFakeVaa, user, swimUsd } = await loadFixture(testFixture);

    const bridgedSwimUsd = swimUsd.toAtomic(1);

    expect(await swimUsd.balanceOf(user)).to.equal(0);
    await routingProxy.crossChainComplete(
      user,
      createFakeVaa(bridgedSwimUsd, new SwimPayload(1, asBytes32String(user.address))),
      swimUsd,
      0,
      memo
    );
    expect(await swimUsd.balanceOf(user)).to.equal(bridgedSwimUsd);
  });

  it("crossChainComplete - bridge and swap", async function () {
    const { routingProxy, createFakeVaa, user, swimUsd, usdt } = await loadFixture(testFixture);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const expectedUsdt = usdt.toAtomic("0.929849");

    expect(await swimUsd.balanceOf(user)).to.equal(0);
    await routingProxy.crossChainComplete(
      user,
      createFakeVaa(bridgedSwimUsd, new SwimPayload(1, asBytes32String(user.address))),
      usdt,
      0,
      memo
    );
    expect(await usdt.balanceOf(user)).to.be.closeTo(expectedUsdt, tolerance);
  });

  it("propellerInitiate", async function () {});

  it("propellerComplete", async function () {});
});
