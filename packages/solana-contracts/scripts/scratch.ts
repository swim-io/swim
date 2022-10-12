import * as fs from "fs";
import * as path from "path";

import type { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_ETH, tryNativeToHexString } from "@certusone/wormhole-sdk";
import type { Program } from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  Spl,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  DEFAULT_SOL_USD_FEED,
  SWIM_USD_TO_TOKEN_NUMBER,
  USDC_TO_TOKEN_NUMBER,
  USDT_TO_TOKEN_NUMBER,
  setComputeUnitLimitIx,
} from "../src/__tests__/consts";
import {
  getPropellerPda,
  getPropellerRedeemerPda,
  getTargetChainIdMapAddr,
  getTargetTokenIdMapAddr,
} from "../src/__tests__/propeller/propellerUtils";
import type { Propeller } from "../src/artifacts/propeller";
import type { TwoPool } from "../src/artifacts/two_pool";
import crypto from "crypto";

const provider = AnchorProvider.env();
setProvider(provider);
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const twoPoolProgram = workspace.TwoPool as Program<TwoPool>;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const propellerProgram = workspace.Propeller as Program<Propeller>;
const splToken = Spl.token(provider);
const PROPELLER_PID = propellerProgram.programId;

const payer = (provider.wallet as NodeWallet).payer;
const propellerAdmin = payer;

type InitParameters = {
  readonly gasKickstartAmount: BN;
  readonly secpVerifyInitFee: BN;
  readonly secpVerifyFee: BN;
  readonly postVaaFee: BN;
  readonly completeWithPayloadFee: BN;
  readonly initAtaFee: BN;
  readonly processSwimPayloadFee: BN;
  readonly marginalPricePoolTokenIndex: number;
};
const DEFAULT_INIT_PROPELLER_PARAMS: InitParameters = {
  gasKickstartAmount: new BN(0.75 * web3.LAMPORTS_PER_SOL),
  secpVerifyInitFee: new BN(0.000045 * web3.LAMPORTS_PER_SOL),
  secpVerifyFee: new BN(0.00004 * web3.LAMPORTS_PER_SOL),
  postVaaFee: new BN(0.00005 * web3.LAMPORTS_PER_SOL),
  completeWithPayloadFee: new BN(0.0000055 * web3.LAMPORTS_PER_SOL),
  initAtaFee: new BN(0.25 * web3.LAMPORTS_PER_SOL),
  processSwimPayloadFee: new BN(0.00001 * web3.LAMPORTS_PER_SOL),
  marginalPricePoolTokenIndex: 0,
};

type PropellerConfig = {
  readonly swimUsdPool: web3.PublicKey;
  readonly wormholeCore: web3.PublicKey;
  readonly wormholeTokenBridge: web3.PublicKey;
  readonly targetChains: readonly TargetChain[];
};

type TargetChain = {
  readonly targetChainId: number;
  readonly targetAddress: string;
  readonly tokenBridge: string;
};

type PoolInfo = {
  readonly address: web3.PublicKey;
  readonly tokenMints: readonly web3.PublicKey[];
  readonly tokenAccounts: readonly web3.PublicKey[];
  readonly lpMint: web3.PublicKey;
  readonly govFeeKey: web3.PublicKey;
};

type PropellerInfo = {
  readonly address: web3.PublicKey;
  readonly feeVault: web3.PublicKey;
  readonly redeemer: web3.PublicKey;
  readonly redeemerEscrow: web3.PublicKey;
};

let config: PropellerConfig;
let swimUsdMint: web3.PublicKey;
// // default to localnet
// let WORMHOLE_CORE_PID = new web3.PublicKey(
//   "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
// );
// let WORMHOLE_TOKEN_BRIDGE_PID = new web3.PublicKey(
//   "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
// );
let swimUsdPoolInfo: PoolInfo;
// let tokenBridgeMint: web3.PublicKey;
let propellerInfo: PropellerInfo;
let targetTokenIdMaps: ReadonlyMap<number, web3.PublicKey>;
let targetChainIdMaps: ReadonlyMap<number, web3.PublicKey>;
const aggregator = DEFAULT_SOL_USD_FEED;

// class PropellerProgram {
//   program: Program<Propeller>;
//   propellerPda: web3.PublicKey;
//   propellerRedeemerPda: web3.PublicKey;
// }

/**
 * Steps(assumes pool is already initialized):
 * 1. Load Configs (swimUsdPool, wormholePids, targetChains)
 * 2. Initialize Propeller State/Config Account
 * 3. Create TargetTokenId Maps
 * 4. Create TargetChain Maps
 */
async function setupPropeller() {
  config = loadConfig();
  console.info(`Using config: ${JSON.stringify(config)}`);
  swimUsdPoolInfo = await getPoolInfo();
  swimUsdMint = swimUsdPoolInfo.lpMint;
  console.info(`swimUsdPoolInfo: ${JSON.stringify(swimUsdPoolInfo)}`);
  propellerInfo = await initializePropellerState();
  console.info(`propellerInfo: ${JSON.stringify(propellerInfo)}`);
  // targetTokenIdMaps = await createTargetTokenIdMaps();
  // console.info(
  //   `targetTokenIdMaps: ${JSON.stringify(
  //     Object.fromEntries(targetTokenIdMaps),
  //   )}`,
  // );
  // await fetchAndPrintIdMap(
  //   targetTokenIdMaps,
  //   async (addr) => await propellerProgram.account.tokenIdMap.fetch(addr),
  //   // propellerProgram.account.tokenIdMap.fetch,
  //   "targetTokenId",
  // );
  //
  // // await printTargetTokenIdMaps();
  // targetChainIdMaps = await createTargetChainMaps();
  //
  // console.info(
  //   `targetChainIdMaps: ${JSON.stringify(
  //     Object.fromEntries(targetChainIdMaps),
  //   )}`,
  // );
  // // await printTargetChainMaps();
  // await fetchAndPrintIdMap(
  //   targetChainIdMaps,
  //   async (addr) => await propellerProgram.account.targetChainMap.fetch(addr),
  //   // propellerProgram.account.targetChainMap.fetch,
  //   "targetChainId",
  // );
  //
  // console.info(`transferring tokens`);
  // await transferTokens();
}

function loadConfig(): PropellerConfig {
  swimUsdMint = web3.PublicKey.default;
  const isDevnet = provider.connection.rpcEndpoint.includes("devnet");
  let configPath = "localnet_config.json";

  if (isDevnet) {
    configPath = "devnet_config.json";
    console.info(`Using devnet`);
    // WORMHOLE_CORE_PID = new web3.PublicKey(
    //   "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
    // );
    // WORMHOLE_TOKEN_BRIDGE_PID = new web3.PublicKey(
    //   "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
    // );
  }
  const rawJson = fs.readFileSync(path.resolve("scripts", configPath));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawConfig = JSON.parse(rawJson.toString());
  // let config: PropellerConfig = {
  //   swimUsdPool: new web3.PublicKey(rawConfig.swimUsdPool),
  //   wormholeCore: new web3.PublicKey(rawConfig.wormholeCore),
  //   wormholeTokenBridge: new web3.PublicKey(rawConfig.wormholeTokenBridge),
  //   targetChains: rawConfig.targetChains,
  // };
  // console.info(`Using config: ${JSON.stringify(config)}`);
  // swimUsdPool = config.swimUsdPool;
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    swimUsdPool: new web3.PublicKey(rawConfig.swimUsdPool),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    wormholeCore: new web3.PublicKey(rawConfig.wormholeCore),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    wormholeTokenBridge: new web3.PublicKey(rawConfig.wormholeTokenBridge),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    targetChains: rawConfig.targetChains,
  };
}

async function getPoolInfo(): Promise<PoolInfo> {
  const poolData = await twoPoolProgram.account.twoPool.fetch(
    config.swimUsdPool,
  );
  // tokenBridgeMint = poolData.lpMintKey;
  return {
    address: config.swimUsdPool,
    tokenMints: poolData.tokenMintKeys,
    tokenAccounts: poolData.tokenKeys,
    lpMint: poolData.lpMintKey,
    govFeeKey: poolData.governanceFeeKey,
  };
}

async function initializePropellerState(): Promise<PropellerInfo> {
  const propellerAddr = await getPropellerPda(swimUsdMint, PROPELLER_PID);

  const propellerFeeVault: web3.PublicKey = await getAssociatedTokenAddress(
    swimUsdMint,
    propellerAddr,
    true,
  );
  const propellerRedeemer = await getPropellerRedeemerPda(PROPELLER_PID);

  const propellerRedeemerEscrow: web3.PublicKey =
    await getAssociatedTokenAddress(swimUsdMint, propellerRedeemer, true);
  const initParams = {
    ...DEFAULT_INIT_PROPELLER_PARAMS,
    marginalPricePool: swimUsdPoolInfo.address,
    marginalPricePoolTokenMint: swimUsdPoolInfo.tokenMints[0],
  };
  console.info(`
    propellerAddr: ${propellerAddr.toString()}
    propellerFeeVault: ${propellerFeeVault.toString()}
    propellerRedeemer: ${propellerRedeemer.toString()}
    propellerRedeemerEscrow: ${propellerRedeemerEscrow.toString()}
    propellerAdmin: ${propellerAdmin.publicKey.toString()}
    payer: ${payer.publicKey.toString()}

  `);

  let propellerData = await propellerProgram.account.propeller.fetchNullable(
    propellerAddr,
  );
  if (!propellerData) {
    console.info(`initializing propeller`);
    await propellerProgram.methods
      .initialize(initParams)
      .accounts({
        propeller: propellerAddr,
        propellerRedeemerEscrow,
        propellerFeeVault,
        admin: propellerAdmin.publicKey,
        swimUsdMint,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        pool: swimUsdPoolInfo.address,
        poolTokenMint0: swimUsdPoolInfo.tokenMints[0],
        poolTokenMint1: swimUsdPoolInfo.tokenMints[1],
        lpMint: swimUsdPoolInfo.lpMint,
        twoPoolProgram: twoPoolProgram.programId,
        aggregator,
      })
      .signers([propellerAdmin, payer])
      .rpc();
  } else {
    console.info("propeller already initialized");
  }
  propellerData = await propellerProgram.account.propeller.fetch(propellerAddr);
  console.info(`PropellerData: ${JSON.stringify(propellerData, null, 2)}`);
  return {
    address: propellerAddr,
    feeVault: propellerData.feeVault,
    redeemer: propellerRedeemer,
    redeemerEscrow: propellerRedeemerEscrow,
  };
}

// void setupPropeller();
function main() {
  const SWIM_MEMO_LENGTH = 16;
  // NOTE: Please always use random bytes to avoid conflicts with other users
  const bytes = crypto.randomBytes(SWIM_MEMO_LENGTH);
  const bytesHex = bytes.toString("hex");
  const bytesUtf8 = bytes.toString("utf8");
  const bytesHexByteLength = Buffer.byteLength(bytesHex, "hex");
  const bytesUtf8ByteLength = Buffer.byteLength(bytesUtf8, "utf8");
  console.info(`
    bytes: ${bytes}
    bytesHex: ${bytesHex}
    bytesUtf8: ${bytesUtf8}
    bytesHexByteLength: ${bytesHexByteLength}
    bytesUtf8ByteLength: ${bytesUtf8ByteLength}
  `);
}
void main();
