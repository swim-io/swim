/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber, parseFixed } from "@ethersproject/bignumber";
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
import { PoolWrapper, RoutingWrapper, TokenWrapper } from "../src/testUtils";
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

const asBigNumber = (fixedValue: string, decimals: number) => {
  const index = fixedValue.indexOf(".");
  const truncated = index === -1 ? fixedValue : fixedValue.slice(0, index + decimals + 1);
  return parseFixed(truncated, decimals);
};

const tenToThe = (exp: number) => BigNumber.from(10).pow(exp);

const toSwimPayload = (toOwner: HasAddress, ...args: readonly any[]) =>
  new SwimPayload(1, asBytes(toOwner.address, 32), ...args);

describe("Routing CrossChain and Propeller Defi Operations", function () {
  const liquidityProviderFunds = BigNumber.from(1e5);
  const baseAmount = BigNumber.from("10");
  const tolerance = (token: TokenWrapper) => token.toAtomic("0.000001");

  const asAtomic = (token: TokenWrapper, val: string | BigNumber | number) =>
    typeof val === "string" ? token.toAtomic(val) : val;

  function expectCloseTo(
    token: TokenWrapper,
    actual: string | BigNumber | number,
    expected: string | BigNumber | number,
    toleranceMultiplier = 1
  ) {
    expect(asAtomic(token, actual)).to.be.closeTo(
      asAtomic(token, expected),
      tolerance(token).mul(toleranceMultiplier)
    );
  }

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
      expect(tokenBridgePayload.amount).to.be.closeTo(expectedAmount, 2);
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

      if ("address" in recipient)
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

    expect(await usdc.balanceOf(user)).to.equal(0);
    expectCloseTo(usdt, await usdt.balanceOf(user), expectedAmount);
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

    expectCloseTo(usdt, await usdt.balanceOf(user), expectedAmount);
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

  it("propellerComplete - fixedGasPrice", async function () {
    const { routingProxy, createFakeVaa, liquidityProvider, user, swimUsd } = await loadFixture(
      testFixture
    );

    const feeConfig = await routingProxy.propellerFeeConfig();
    expect(feeConfig.method).to.equal(0);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const maxPropellerFee = swimUsd.toAtomic("0.2");
    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(user, true, false, maxPropellerFee, swimUsd.tokenNumber, memo)
    );

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    const { gasUsed, effectiveGasPrice } = await routingProxy.propellerComplete(
      liquidityProvider,
      fakeVaa
    );

    const expectedAmount = bridgedSwimUsd.sub(feeConfig.serviceFee).sub(
      gasUsed
        .mul(effectiveGasPrice.add(10 ** 9))
        .mul(feeConfig.fixedSwimUsdPerGasToken)
        .div(BigNumber.from(10).pow(18))
    );

    expectCloseTo(swimUsd, await swimUsd.balanceOf(user), expectedAmount, 10 ** 4);
  });

  //A word on uniswap sqrt prices - we can get a realistic price from:
  //  https://etherscan.io/address/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8#readContract
  // taken from there, we get a sqrtPriceX96 of "2099927254595430908151663701042111" which
  // corresponds to a Uniswap tick of 203711 and should be about ~1425 USDC/ETH (with token0 = usdc,
  // token1 = WETH)
  //We can verify this:
  // usdc has 6 decimals, WETH has 18 so:
  // sqrtPrice is token1 priced in token0 - so in our case the unintuitive ratio of WETH/USDC
  // sqrtPrice is also priced in atomic units and specified in a 64.96 bits format (i.e. 96 bits
  //  for the fractional part, 64 for the integer part)
  //So to get to the actual USDC/WETH price (in human units) we calculate:
  // decimalDifference = 18 - 6 = 12 and thus
  // BigNumber.from(10).pow(12).div(sqrtPrice.pow(2).div(BigNumber.from(2).pow(2 * 96))

  it("propellerComplete - uniswapOracle", async function () {
    const { pool, routingProxy, createFakeVaa, deployer, liquidityProvider, user, swimUsd, usdc } =
      await loadFixture(testFixture);

    //cheapen swimUSD as compared to the other tokens
    await pool.removeExactOutput(
      liquidityProvider,
      pool.toAtomicAmounts([0, 9, 9]),
      pool.lpToken.toAtomic(baseAmount).mul(3)
    );

    const ethDecimals = 18;

    const deployMockUniswap = async (intuitiveUsdcPerEth: number, usdcIsFirst: boolean) => {
      //usdcIsFirst -> WETH/USDC (unintuitive) rather than USDC/WETH (intuitive)
      //realistically this would be WETH but for testing we don't care
      const wethAddr = "0x" + "00".repeat(20);
      const addrs = usdcIsFirst
        ? ([usdc.address, wethAddr] as const)
        : ([wethAddr, usdc.address] as const);

      const sqrtPrice = Math.pow(intuitiveUsdcPerEth, 0.5 - (usdcIsFirst ? 1 : 0));
      const sqrtPriceBN = asBigNumber(sqrtPrice.toString(), 18)
        .mul(BigNumber.from(2).pow(96))
        .div(tenToThe(18));
      const factor = tenToThe(ethDecimals / 2 - Math.floor(usdc.decimals / 2)).mul(
        usdc.decimals % 2 == 1 ? asBigNumber(Math.sqrt(10).toString(), 18) : tenToThe(18)
      );

      const uniswapPrice = usdcIsFirst
        ? sqrtPriceBN.mul(factor).div(tenToThe(18))
        : sqrtPriceBN.mul(tenToThe(18)).div(factor);

      const mockUniswap = await (
        await ethers.getContractFactory("MockUniswapV3Pool")
      ).deploy(...addrs, uniswapPrice);
      await mockUniswap.deployed();
      return mockUniswap;
    };

    const intuitiveUsdcPerEth = 100;
    const mockUniswap = await deployMockUniswap(intuitiveUsdcPerEth, false);
    const usdcPerEth = ethers.utils.formatUnits(intuitiveUsdcPerEth, ethDecimals - usdc.decimals);

    await routingProxy.usePropellerUniswapOracle(deployer, usdc, mockUniswap);

    const feeConfig = await routingProxy.propellerFeeConfig();
    expect(feeConfig.method).to.equal(1);

    const bridgedSwimUsd = swimUsd.toAtomic(1);
    const maxPropellerFee = swimUsd.toAtomic("0.2");
    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(user, true, false, maxPropellerFee, swimUsd.tokenNumber, memo)
    );

    expect(await swimUsd.balanceOf(user)).to.equal(0);

    const poolMarginalPrices = await pool.getMarginalPrices();

    const { gasUsed, effectiveGasPrice } = await routingProxy.propellerComplete(
      liquidityProvider,
      fakeVaa
    );

    const swimUsdPerUsdc = ethers.utils.formatUnits(
      asBigNumber(poolMarginalPrices[1], 36).div(asBigNumber(poolMarginalPrices[0], 18)),
      18
    );
    const swimUsdPerGasToken = ethers.utils.formatUnits(
      asBigNumber(swimUsdPerUsdc, 18).mul(asBigNumber(usdcPerEth, 18)),
      36
    );
    const remuneratedGasPrice = effectiveGasPrice; //already contains ~1 gwei tip apparently
    const gasTokenCost = gasUsed.mul(remuneratedGasPrice);
    const expectedSwimUsdGasFee = gasTokenCost
      .mul(asBigNumber(swimUsdPerGasToken, 18))
      .div(tenToThe(18));

    const expectedBalance = bridgedSwimUsd.sub(feeConfig.serviceFee).sub(expectedSwimUsdGasFee);
    // console.log("------------------------------------");
    // console.log("  actual gas used:", gasUsed);
    // console.log("effectiveGasPrice:", effectiveGasPrice);
    // console.log("  actual gas cost:", ethers.utils.formatEther(gasUsed.mul(effectiveGasPrice)));
    // console.log("------------------------------------");
    // console.log("remuneratedGasP:", remuneratedGasPrice);
    // console.log("   gasTokenCost:", gasTokenCost);
    // console.log("marginal Prices:", poolMarginalPrices);
    // console.log("   swimUSD/USDC:", swimUsdPerUsdc);
    // console.log("       USDC/ETH:", usdcPerEth);
    // console.log("    SwimUSD/ETH:", swimUsdPerGasToken);
    // console.log("swimUSD gas fee:", expectedSwimUsdGasFee);
    // console.log("------------------------------------");
    // console.log("balance SwimUSD:", await swimUsd.balanceOf(user));
    // console.log("balance    usdc:", await usdc.balanceOf(user));
    // console.log("expected:", expectedBalance);

    expectCloseTo(swimUsd, await swimUsd.balanceOf(user), expectedBalance, 10 ** 4);
  });
});
