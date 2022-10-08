/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { BigNumber } from "@ethersproject/bignumber";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import Decimal from "decimal.js";
import { ethers, network } from "hardhat";

import {
  GAS_TOKEN_DECIMALS,
  LOCAL,
  ROUTING_CONTRACT_SOLANA_ADDRESS,
  SWIM_USD_SOLANA_ADDRESS,
  SWIM_USD_TOKEN_INDEX,
  WORMHOLE_SOLANA_CHAIN_ID,
} from "../src/config";
import { getRegular } from "../src/deploy";
import { deployment } from "../src/deployment";
import { CoreBridgeMessage, SwimPayload, TokenBridgePayload } from "../src/payloads";
import {
  PoolWrapper,
  RoutingWrapper,
  expectCloseTo,
  expectEqual,
  toDecimal,
} from "../src/testUtils";
import type { Decimalish, HasAddress, TokenWrapper } from "../src/testUtils";
import type { IWormhole } from "../typechain-types/contracts/interfaces/IWormhole";

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

// const asBigNumber = (fixedValue: string, decimals: number) => {
//   const index = fixedValue.indexOf(".");
//   const truncated = index === -1 ? fixedValue : fixedValue.slice(0, index + decimals + 1);
//   return parseFixed(truncated, decimals);
// };

// const tenToThe = (exp: number) => BigNumber.from(10).pow(exp);

const toSwimPayload = (toOwner: HasAddress, ...args: readonly any[]) =>
  new SwimPayload(1, asBytes(toOwner.address, 32), ...args);

describe("Routing CrossChain and Propeller Defi Operations", function () {
  const liquidityProviderFunds = 1e5;
  const baseAmount = 10;
  const userTokenIndex = 1;
  const userFunds = 1;
  const memo = Buffer.from("00".repeat(15) + "01", "hex");
  const evmChainId = 37; //some random number that's not 1 (== WORMHOLE_SOLANA_CHAIN_ID)

  async function testFixture() {
    //for some reason we need to reset, otherwise Pool and Routing test suites interfere...
    await network.provider.send("hardhat_reset");
    const [deployer, govFeeRecip, liquidityProvider, user] = await ethers.getSigners();
    const governance = deployer;

    await deployment(LOCAL, { print: false });

    const routing = await RoutingWrapper.create();

    const { swimUsd } = routing;

    const pool = await PoolWrapper.create(LOCAL.pools[0].salt);

    for (const token of pool.tokens) await token.mint(liquidityProvider, liquidityProviderFunds);

    await pool.add(
      liquidityProvider,
      pool.tokens.map(() => baseAmount),
      0
    );
    await pool.tokens[userTokenIndex].mint(user, userFunds);

    const wormhole = (await getRegular("MockWormhole", [])) as IWormhole;
    const tokenBridge = await getRegular("MockTokenBridge", [wormhole.address]);
    const createFakeVaa = (amount: Decimalish, targetChain: number, swimPayload: SwimPayload) => {
      const tokenBridgePayload = new TokenBridgePayload(
        3, //payloadId 1 == transfer, 3 == transferWithPayload
        swimUsd.toAtomic(amount),
        asBytes(SWIM_USD_SOLANA_ADDRESS, 32),
        WORMHOLE_SOLANA_CHAIN_ID,
        asBytes(routing.address, 32),
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
        asBytes(routing.address, 32), //emitterAddress
        BigNumber.from(0), //sequence
        15, //consistencyLevel
        tokenBridgePayload.encode()
      );
      return coreBridgeMessage.encode();
    };

    const checkEmittedPayload = async (
      expectedAmount: Decimalish,
      targetChain: number,
      recipient: Buffer | HasAddress,
      propellerParams?: {
        readonly propellerEnabled: boolean;
        readonly gasKickstart: boolean;
        readonly maxPropellerFee: Decimalish;
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
      await expectCloseTo(swimUsd, swimUsd.toHuman(tokenBridgePayload.amount), expectedAmount);
      expect(asHex(tokenBridgePayload.originAddress)).to.equal(SWIM_USD_SOLANA_ADDRESS);
      expect(tokenBridgePayload.originChain).to.equal(WORMHOLE_SOLANA_CHAIN_ID);
      if (targetChain !== WORMHOLE_SOLANA_CHAIN_ID)
        expect(asEvmAddress(tokenBridgePayload.targetAddress)).to.equal(routing.address);
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
        await expectEqual(
          swimUsd,
          swimUsd.toHuman(swimPayload.maxPropellerFee),
          propellerParams.maxPropellerFee
        );
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
      routing,
      swimUsd,
      checkEmittedPayload,
      createFakeVaa,
    };
  }

  it("onChainSwap - correct defi outputs", async function () {
    const { routing, pool, govFeeRecip, user } = await loadFixture(testFixture);

    const inputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const outputIndex = 2;

    const inputToken = pool.tokens[inputIndex];
    const outputToken = pool.tokens[outputIndex];

    const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
    const expected = (await pool.poolmath()).swapExactInput(inputAmounts, outputIndex);

    await routing.onChainSwap(
      user,
      inputToken,
      inputAmount,
      user,
      outputToken,
      SWIM_USD_TOKEN_INDEX
    );

    await expectEqual(pool.tokens[inputIndex], user, 0);
    await expectCloseTo(pool.tokens[outputIndex], user, expected.stableOutputAmount);
    await expectCloseTo(pool.lpToken, govFeeRecip, expected.governanceMintAmount);
  });

  it("crossChainInitiate - correct defi outputs", async function () {
    const { routing, pool, govFeeRecip, user, checkEmittedPayload } = await loadFixture(
      testFixture
    );

    const inputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const recipient = user;
    const targetChain = evmChainId;

    const inputToken = pool.tokens[inputIndex];
    const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
    const expected = (await pool.poolmath()).swapExactInput(inputAmounts, SWIM_USD_TOKEN_INDEX);

    await routing.crossChainInitiate(
      user,
      inputToken,
      inputAmount,
      0,
      targetChain,
      recipient,
      memo
    );

    await expectEqual(pool.tokens[inputIndex], user, 0);
    await expectCloseTo(pool.lpToken, govFeeRecip, expected.governanceMintAmount);
    expect((await routing.getMemoInteractionEvents(memo)).length).to.equal(1);
    await checkEmittedPayload(expected.stableOutputAmount, targetChain, recipient);
  });

  it("crossChainComplete - bridge only", async function () {
    const { routing, user, swimUsd, createFakeVaa } = await loadFixture(testFixture);

    const bridgedSwimUsd = 1;
    const fakeVaa = createFakeVaa(bridgedSwimUsd, evmChainId, toSwimPayload(user));

    await expectEqual(swimUsd, user, 0);

    await routing.crossChainComplete(user, fakeVaa, swimUsd, 0, memo);

    await expectEqual(swimUsd, user, bridgedSwimUsd);
  });

  it("crossChainComplete - bridge and swap", async function () {
    const { routing, pool, user, govFeeRecip, swimUsd, createFakeVaa } = await loadFixture(
      testFixture
    );

    const bridgedSwimUsd = 1;
    const outputIndex = 2;

    const outputToken = pool.tokens[outputIndex];
    const inputAmounts = pool.tokens.map((_, i) =>
      i === SWIM_USD_TOKEN_INDEX ? bridgedSwimUsd : 0
    );
    const expected = (await pool.poolmath()).swapExactInput(inputAmounts, outputIndex);

    const fakeVaa = createFakeVaa(bridgedSwimUsd, evmChainId, toSwimPayload(user));

    await routing.crossChainComplete(user, fakeVaa, outputToken, 0, memo);

    await expectEqual(swimUsd, user, 0);
    await expectCloseTo(outputToken, user, expected.stableOutputAmount);
    await expectCloseTo(pool.lpToken, govFeeRecip, expected.governanceMintAmount);
  });

  it("propellerInitiate", async function () {
    const { routing, pool, govFeeRecip, user, swimUsd, checkEmittedPayload } = await loadFixture(
      testFixture
    );

    const inputIndex = userTokenIndex;
    const inputAmount = userFunds;
    const recipient = user;
    const targetChain = evmChainId;
    const propellerParams = {
      propellerEnabled: true,
      gasKickstart: false,
      maxPropellerFee: 0.2,
      toToken: swimUsd,
      memo: memo,
    };
    const inputToken = pool.tokens[inputIndex];
    const inputAmounts = pool.tokens.map((_, i) => (i === inputIndex ? inputAmount : 0));
    const expected = (await pool.poolmath()).swapExactInput(inputAmounts, SWIM_USD_TOKEN_INDEX);

    await routing.propellerInitiate(
      user,
      inputToken,
      inputAmount,
      targetChain,
      recipient,
      propellerParams.gasKickstart,
      propellerParams.maxPropellerFee,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      propellerParams.toToken.tokenNumber!,
      propellerParams.memo
    );

    await expectEqual(inputToken, user, 0);
    await expectEqual(swimUsd, user, 0);
    await expectCloseTo(pool.lpToken, govFeeRecip, expected.governanceMintAmount);
    expect((await routing.getMemoInteractionEvents(memo)).length).to.equal(1);
    await checkEmittedPayload(expected.stableOutputAmount, evmChainId, recipient, propellerParams);
  });

  it("propellerComplete - fixedGasPrice", async function () {
    const { routing, liquidityProvider, governance, user, swimUsd, createFakeVaa } =
      await loadFixture(testFixture);

    const fixedSwimUsdPerGasToken = 10;

    await routing.usePropellerFixedGasTokenPrice(governance, fixedSwimUsdPerGasToken);

    const feeConfig = await routing.propellerFeeConfig();
    expect(feeConfig.method).to.equal("fixedSwimUsdPerGasToken");
    expect(feeConfig.fixedSwimUsdPerGasToken.toNumber()).to.equal(fixedSwimUsdPerGasToken);

    const bridgedSwimUsd = 1;
    const maxPropellerFee = 0.2;
    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(user, true, false, swimUsd.toAtomic(maxPropellerFee), swimUsd.tokenNumber, memo)
    );

    await expectEqual(swimUsd, user, 0);

    const { gasUsed, effectiveGasPrice } = await routing.propellerComplete(
      liquidityProvider,
      fakeVaa
    );

    //already contains ~1 gwei tip apparently, so we don't add PROPELLER_GAS_TIP
    const gasCostInGasTokens = gasUsed.mul(effectiveGasPrice);

    const expectedSwimUsdFee = feeConfig.serviceFee.add(
      toDecimal(gasCostInGasTokens.toString())
        .mul(feeConfig.fixedSwimUsdPerGasToken)
        .div(toDecimal(10).pow(GAS_TOKEN_DECIMALS))
    );

    const expectedAmount = toDecimal(bridgedSwimUsd).sub(expectedSwimUsdFee);

    // console.log("actualGasUsed", gasUsed);
    // console.log("expected:", expectedAmount);
    // console.log("  actual:", await swimUsd.balanceOf(user));

    //TODO messy check
    await expectCloseTo(swimUsd, user, expectedAmount, 100);
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
    const { routing, pool, deployer, liquidityProvider, user, swimUsd, createFakeVaa } =
      await loadFixture(testFixture);

    const bridgedSwimUsd = 1;
    const maxPropellerFee = 0.2;
    const withSwap = false;
    const usdcIsFirst = true;
    const usdcPerEthHuman = 10;
    const skewBalances = true;
    const withDebugOutput = false;

    const usdc = pool.tokens[1];
    const outputIndex = withSwap ? 2 : 0;
    const outputToken = pool.tokens[outputIndex];
    //cheapen swimUSD as compared to the other tokens
    if (skewBalances) await pool.removeExactOutput(liquidityProvider, [0, 9, 9], baseAmount * 3);

    const tenToThe = (exp: number) => toDecimal(10).pow(exp);

    //usdcIsFirst -> WETH/USDC (unintuitive) rather than USDC/WETH (intuitive)
    //realistically this would be WETH but for testing we don't care
    const wethAddr = "0x" + "00".repeat(20);
    const addrs = usdcIsFirst
      ? ([usdc.address, wethAddr] as const)
      : ([wethAddr, usdc.address] as const);

    const sqrtPrice = Math.pow(usdcPerEthHuman, 0.5 - (usdcIsFirst ? 1 : 0));
    const sqrtPriceX96 = toDecimal(sqrtPrice).mul(toDecimal(2).pow(96));
    // const uniswapPrice = usdcIsFirst
    //   ? sqrtPriceX96.mul(tenToThe(swimUsd.decimals)).div(tenToThe(GAS_TOKEN_DECIMALS))
    //   : sqrtPriceX96.mul(tenToThe(GAS_TOKEN_DECIMALS)).div(tenToThe(swimUsd.decimals));
    const uniswapPrice = sqrtPriceX96.mul(
      //the final div 2 is because we are taking the square root and hence the decimal
      // difference is also halfed!
      tenToThe(((GAS_TOKEN_DECIMALS - swimUsd.decimals) * (usdcIsFirst ? 1 : -1)) / 2)
    );

    const mockUniswap = await (
      await ethers.getContractFactory("MockUniswapV3Pool")
    ).deploy(...addrs, uniswapPrice.trunc().toFixed());
    await mockUniswap.deployed();
    const usdcPerEthAtomic = toDecimal(usdcPerEthHuman).mul(
      tenToThe(usdc.decimals - GAS_TOKEN_DECIMALS)
    );

    await routing.usePropellerUniswapOracle(deployer, usdc, mockUniswap);

    const feeConfig = await routing.propellerFeeConfig();
    expect(feeConfig.method).to.equal("uniswapOracle");

    const fakeVaa = createFakeVaa(
      bridgedSwimUsd,
      evmChainId,
      toSwimPayload(
        user,
        true,
        false,
        swimUsd.toAtomic(maxPropellerFee),
        outputToken.tokenNumber,
        memo
      )
    );

    await expectEqual(swimUsd, user, 0);

    const poolmath = await pool.poolmath();
    const poolMarginalPricesAtomic = await pool.getMarginalPrices();

    const receipt = await routing.propellerComplete(liquidityProvider, fakeVaa);
    const { gasUsed, effectiveGasPrice } = receipt;

    const swimUsdPerUsdcAtomic = poolMarginalPricesAtomic[1].div(poolMarginalPricesAtomic[0]);
    const swimUsdPerGasTokenAtomic = swimUsdPerUsdcAtomic.mul(usdcPerEthAtomic);
    const gasTokenCostWei = toDecimal(gasUsed.mul(effectiveGasPrice).toString());
    const expectedSwimUsdGasFeeAtomic = gasTokenCostWei.mul(swimUsdPerGasTokenAtomic);
    const expectedSwimUsdGasFee = swimUsd.toHuman(expectedSwimUsdGasFeeAtomic.trunc().toString());
    const uncheckedSwimUsdFee = feeConfig.serviceFee.add(expectedSwimUsdGasFee);
    const checkedSwimUsdFee = Decimal.min(uncheckedSwimUsdFee, maxPropellerFee, bridgedSwimUsd);

    const expectedSwimUsd = toDecimal(bridgedSwimUsd).sub(checkedSwimUsdFee);

    const expectedBalance =
      outputToken.tokenNumber === swimUsd.tokenNumber
        ? expectedSwimUsd
        : poolmath
            .swapExactInput(
              pool.tokens.map((_, i) => (i === 0 ? expectedSwimUsd : 0)),
              outputIndex
            )
            .stableOutputAmount.toFixed(outputToken.decimals);

    if (withDebugOutput) {
      const actualSwimUsd = swimUsd.toHuman(
        receipt.logs.find(
          (log) =>
            log.topics[0] ===
              ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes("Transfer(address,address,uint256)")
              ) &&
            log.topics[1] === asHex(asBytes(routing.address, 32)) &&
            log.topics[2] === asHex(asBytes(pool.address, 32))
        )?.data ?? "0"
      );
      const swimUsdPerGasTokenHuman = swimUsdPerGasTokenAtomic.mul(
        tenToThe(GAS_TOKEN_DECIMALS - swimUsd.decimals)
      );
      console.table(
        [
          ["actual gas used", "gas", "receipt", gasUsed.toString()],
          ["actual gas price", "wei", "receipt", effectiveGasPrice.toString()],
          ["actual gas cost", "wei", "receipt*", gasTokenCostWei],
          ...poolMarginalPricesAtomic.map((mp, i) => [
            `marginal ${pool.tokens[i].symbol}/LP`,
            "atomic",
            "pool on-chain",
            mp,
          ]),
          ["swimUSD/USDC", "atomic", "pool on-chain*", swimUsdPerUsdcAtomic],
          ["USDC/ETH", "human", "test", usdcPerEthHuman],
          ["USDC/ETH", "atomic", "test", usdcPerEthAtomic],
          ["SwimUSD/ETH", "human", "pool on-chain*", swimUsdPerGasTokenHuman],
          ["SwimUSD/ETH", "atomic", "pool on-chain*", swimUsdPerGasTokenAtomic],
          ["swimUSD serive fee", "human", "on-chain", feeConfig.serviceFee],
          ["expected swimUSD gas fee", "human", "pool on-chain*", expectedSwimUsdGasFee],
          ["expected unchecked SwimUSD fee", "human", "pool on-chain*", uncheckedSwimUsdFee],
          ["max Propeller fee", "human", "test", maxPropellerFee],
          ["expected checked SwimUSD fee", "human", "pool on-chain*", checkedSwimUsdFee],
          ["bridged SwimUSD", "human", "test", bridgedSwimUsd],
          ["expected SwimUSD", "human", "pool on-chain*", expectedSwimUsd],
          ["actual SwimUSD", "human", "receipt", actualSwimUsd],
          ["expected balance", "human", "on-chain", expectedBalance],
          ["actual balance", "human", "on-chain", await outputToken.balanceOf(user)],
        ].map((e) => {
          const asDec = toDecimal(e[3]);
          const value = asDec.gt(1e-6) ? asDec.toFixed(6) : asDec.toExponential(2);
          return { what: e[0], unit: e[1], source: e[2], value: value.padStart(25) };
        })
      );
    }

    await expectCloseTo(outputToken, user, expectedBalance, 5000);
  });
});
