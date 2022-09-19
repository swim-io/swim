/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BN } from "bn.js";
import { expect, use } from "chai";
import { ethers, network } from "hardhat";

import {
  LOCAL,
  ROUTING_CONTRACT_SOLANA_ADDRESS,
  SWIM_USD_SOLANA_ADDRESS,
  WORMHOLE_SOLANA_CHAIN_ID,
} from "../src/config";
import { getRegular, getRoutingProxy, getToken } from "../src/deploy";
import { deployment } from "../src/deployment";
import { CoreBridgeMessage, SwimPayload, TokenBridgePayload } from "../src/payloads";
import { PoolWrapper, RoutingWrapper, TokenWrapper, isHasAddress } from "../src/testUtils";
import type { HasAddress } from "../src/testUtils";
import type { IWormhole } from "../typechain-types/contracts/interfaces/IWormhole";

use(require("chai-bn")(BN));

const asBytes = (hexVal: string, size: number) => {
  const _hexVal = (hexVal.startsWith("0x") ? hexVal.slice(2) : hexVal).toLowerCase();
  if (hexVal.length % 2) throw Error(`hex string ${hexVal} has odd number of characters`);

  return Buffer.from(_hexVal.padStart(size * 2, "0"), "hex");
};

const asHex = (buf: Buffer) => "0x" + buf.toString("hex");
const asEvmAddress = (buf: Buffer) => {
  const hexEnc = buf.toString("hex");
  if (buf.length < 20)
    throw Error(`Buffer with hex content ${hexEnc} too short to contain an EVM address`);
  if (hexEnc.slice(0, -40) != "00".repeat(buf.length - 20))
    throw Error(
      `Buffer with hex content ${hexEnc} has non-zero values where it should be ` +
        `left padded with zeros`
    );
  return ethers.utils.getAddress("0x" + hexEnc.slice(-40));
};

const toSwimPayload = (toOwner: HasAddress, ...args: readonly any[]) =>
  new SwimPayload(1, asBytes(toOwner.address, 32), ...args);

describe("Routing CrossChain and Propeller Defi Operations", function () {
  const liquidityProviderFunds = BigNumber.from(1e5);
  const baseAmount = BigNumber.from("10");
  const tolerance = 2;
  const memo = Buffer.from("00".repeat(15) + "01", "hex");
  const evmChainId = 37; //some random number that's not 1 (== WORMHOLE_SOLANA_CHAIN_ID)

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
    const tokenBridge = await getRegular("MockTokenBridge", [wormhole.address]);
    const createFakeVaa = (amount: BigNumber, targetChain: number, swimPayload: SwimPayload) => {
      const tokenBridgePayload = new TokenBridgePayload(
        3, //payloadId 1 == transfer, 3 == transferWithPayload
        amount,
        asBytes(SWIM_USD_SOLANA_ADDRESS, 32),
        WORMHOLE_SOLANA_CHAIN_ID,
        asBytes(routingProxy.address, 32),
        targetChain,
        asBytes(tokenBridge.address, 32),
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
        asBytes(routingProxy.address, 32), //emitterAddress
        BigNumber.from(0), //sequence
        15, //consistencyLevel
        tokenBridgePayload.encode()
      );
      return coreBridgeMessage.encode();
    };

    const checkEmittedPayload = async (
      expectedAmount: BigNumber,
      targetChain: number,
      recipient: Buffer | HasAddress,
      propellerParams?: {
        readonly propellerEnabled: boolean;
        readonly gasKickstart: boolean;
        readonly maxPropellerFee: BigNumber;
        readonly toToken: TokenWrapper | number;
        readonly memo?: Buffer;
      }
    ) => {
      //general note:
      // we use hex comparisons rather than (deep i.e. eql) buffer comparisons because
      // they give more readable outputs in case of mismatch

      const wormholeEvents = await wormhole.queryFilter(wormhole.filters.LogMessagePublished());
      expect(wormholeEvents.length).to.equal(1);
      const tokenBridgePayload = TokenBridgePayload.decode(
        Buffer.from(wormholeEvents[0].args[3].slice(2), "hex")
      );
      expect(tokenBridgePayload.amount).to.be.closeTo(expectedAmount, tolerance);
      expect(asHex(tokenBridgePayload.originAddress)).to.equal(SWIM_USD_SOLANA_ADDRESS);
      expect(tokenBridgePayload.originChain).to.equal(WORMHOLE_SOLANA_CHAIN_ID);
      if (targetChain !== WORMHOLE_SOLANA_CHAIN_ID)
        expect(asEvmAddress(tokenBridgePayload.targetAddress)).to.equal(routingProxy.address);
      else
        expect(asHex(tokenBridgePayload.targetAddress)).to.equal(ROUTING_CONTRACT_SOLANA_ADDRESS);
      expect(tokenBridgePayload.targetChain).to.equal(targetChain);
      const expectedSwimPayloadSize =
        1 + 32 + (propellerParams ? 1 + 1 + 2 + 8 + (propellerParams.memo ? 16 : 0) : 0);
      expect(tokenBridgePayload.extraPayload.length).to.equal(expectedSwimPayloadSize);
      const swimPayload = SwimPayload.decode(tokenBridgePayload.extraPayload);
      expect(swimPayload.version).to.equal(1);

      if (isHasAddress(recipient))
        expect(asEvmAddress(swimPayload.toOwner)).to.equal(recipient.address);
      else expect(asHex(swimPayload.toOwner)).to.equal(asHex(recipient));
      if (propellerParams) {
        expect(swimPayload.propellerEnabled).to.equal(true);
        expect(swimPayload.gasKickstart).to.equal(propellerParams.gasKickstart);
        expect(swimPayload.maxPropellerFee).to.equal(propellerParams.maxPropellerFee);
        expect(swimPayload.toTokenNumber).to.equal(
          typeof propellerParams.toToken === "number"
            ? propellerParams.toToken
            : propellerParams.toToken.tokenNumber
        );
        if (propellerParams.memo) expect(asHex(swimPayload.memo)).to.eql(asHex(memo));
      }
    };

    return {
      deployer,
      governance,
      govFeeRecip,
      liquidityProvider,
      user,
      pool,
      routingProxy,
      checkEmittedPayload,
      createFakeVaa,
      swimUsd,
      usdc,
      usdt,
    };
  }

  it("onChainSwap - correct defi outputs", async function () {
    const { routingProxy, user, usdc, usdt } = await loadFixture(testFixture);
    const expectedAmount = usdt.toAtomic("0.929849");

    await routingProxy.onChainSwap(user, usdc, usdc.toAtomic(1), user, usdt, 0);

    const remainingUsdc = await usdc.balanceOf(user);
    const actualUsdt = await usdt.balanceOf(user);

    expect(remainingUsdc).to.equal(0);
    expect(actualUsdt).to.be.closeTo(expectedAmount, tolerance);
  });

  it("crossChainInitiate - correct defi outputs", async function () {
    const { routingProxy, checkEmittedPayload, user, usdc, swimUsd } = await loadFixture(
      testFixture
    );

    const expectedAmount = swimUsd.toAtomic("0.929849");
    const recipient = user;
    const targetChain = evmChainId;

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
    await checkEmittedPayload(expectedAmount, targetChain, recipient);
  });

  it("crossChainComplete - bridge only", async function () {
    const { routingProxy, createFakeVaa, user, swimUsd } = await loadFixture(testFixture);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const fakeVaa = createFakeVaa(bridgedSwimUsd, evmChainId, toSwimPayload(user));

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    await routingProxy.crossChainComplete(user, fakeVaa, swimUsd, 0, memo);

    expect(await swimUsd.balanceOf(user)).to.equal(bridgedSwimUsd);
  });

  it("crossChainComplete - bridge and swap", async function () {
    const { routingProxy, createFakeVaa, user, swimUsd, usdt } = await loadFixture(testFixture);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const expectedAmount = usdt.toAtomic("0.929849");
    const fakeVaa = createFakeVaa(bridgedSwimUsd, evmChainId, toSwimPayload(user));

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    await routingProxy.crossChainComplete(user, fakeVaa, usdt, 0, memo);

    expect(await usdt.balanceOf(user)).to.be.closeTo(expectedAmount, tolerance);
  });

  it("propellerInitiate", async function () {
    const { routingProxy, checkEmittedPayload, user, swimUsd, usdc } = await loadFixture(
      testFixture
    );

    const expectedAmount = swimUsd.toAtomic("0.929849");
    const recipient = user;
    const targetChain = evmChainId;
    const propellerParams = {
      propellerEnabled: true,
      gasKickstart: false,
      maxPropellerFee: swimUsd.toAtomic("0.2"),
      toToken: swimUsd,
      memo: memo,
    };

    await routingProxy.propellerInitiate(
      user,
      usdc,
      usdc.toAtomic(1),
      targetChain,
      recipient,
      propellerParams.gasKickstart,
      propellerParams.maxPropellerFee,
      propellerParams.toToken.tokenNumber,
      propellerParams.memo
    );

    expect((await routingProxy.getMemoInteractionEvents(memo)).length).to.equal(1);
    await checkEmittedPayload(expectedAmount, evmChainId, recipient, propellerParams);
  });

  it("propellerComplete - flatFee", async function () {
    const { routingProxy, createFakeVaa, liquidityProvider, user, swimUsd } = await loadFixture(
      testFixture
    );

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const expectedAmount = swimUsd.toAtomic("0.97");
    const maxPropellerFee = swimUsd.toAtomic("0.2");
    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(user, true, false, maxPropellerFee, swimUsd.tokenNumber, memo)
    );

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    await routingProxy.propellerComplete(liquidityProvider, fakeVaa);

    expect(await swimUsd.balanceOf(user)).to.equal(expectedAmount);
  });

  it("propellerComplete - uniswapOracle", async function () {
    const { pool, routingProxy, createFakeVaa, deployer, liquidityProvider, user, swimUsd, usdc } =
      await loadFixture(testFixture);

    //from https://etherscan.io/address/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8#readContract
    // corresponds to a tick of 203711 or ~1423 USDC/ETH (where token0 = usdc, token1 = WETH)
    //we can verify this:
    // usdc has 6 decimals, WETH has 18 so:
    // sqrtPrice is token1 priced in token0 - so in our case the unintuitive ratio of WETH/USDC
    // sqrtPrice is also priced in atomic units and specified in a 64.96 bits format (i.e. 96 bits
    //  for the fractional part, 64 for the integer part)
    // so to get to the actual USDC/WETH price (in human units) we calculate:
    // decimalDifference = 18 - 6 = 12 and so
    // BigNumber.from(10).pow(12).div(sqrtPrice.pow(2).div(BigNumber.from(2).pow(2 * 96))
    const sqrtPrice = BigNumber.from("2099927254595430908151663701042111");

    const mockUniswap = await (
      await ethers.getContractFactory("MockUniswapV3Pool")
    ).deploy(
      usdc.address,
      "0x" + "00".repeat(20), //realistically this would be WETH but for testing we don't care
      sqrtPrice
    );
    await mockUniswap.deployed();

    await routingProxy.usePropellerUniswapOracle(deployer, usdc, mockUniswap);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const expectedAmount = swimUsd.toAtomic("0.97");
    const maxPropellerFee = swimUsd.toAtomic("0.2");
    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(user, true, false, maxPropellerFee, swimUsd.tokenNumber, memo)
    );

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    const receipt = await routingProxy.propellerComplete(liquidityProvider, fakeVaa);
    console.log("actual gas used:", receipt.gasUsed);
    console.log(
      "actual gas cost:",
      ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))
    );

    //console.log(await pool.contract.getMarginalPrices());
    //console.log(await swimUsd.balanceOf(user));

    //expect(await swimUsd.balanceOf(user)).to.equal(expectedAmount);
  });
});
