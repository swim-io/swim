import * as fs from "fs";
import * as path from "path";

import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_ETH,
  createNonce,
  tryNativeToHexString,
  tryNativeToUint8Array,
} from "@certusone/wormhole-sdk";
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
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  getPropellerPda,
  getPropellerRedeemerPda,
  getTargetChainIdMapAddr,
  getTargetTokenIdMapAddr,
} from "../src/__tests__/propeller/propellerUtils";
import type { Propeller } from "../src/artifacts/propeller";
import type { TwoPool } from "../src/artifacts/two_pool";

const provider = AnchorProvider.env();
setProvider(provider);
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const twoPoolProgram = workspace.TwoPool as Program<TwoPool>;
const TWO_POOL_PID = twoPoolProgram.programId;
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
let tokenBridgeMint: web3.PublicKey;
let propellerInfo: PropellerInfo;
let targetTokenIdMaps: ReadonlyMap<number, web3.PublicKey>;
let targetChainIdMaps: ReadonlyMap<number, web3.PublicKey>;

let cluster: web3.Cluster;

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
  console.info(`swimUsdPoolInfo: ${JSON.stringify(swimUsdPoolInfo)}`);
  propellerInfo = await initializePropellerState();
  console.info(`propellerInfo: ${JSON.stringify(propellerInfo)}`);
  targetTokenIdMaps = await createTargetTokenIdMaps();
  console.info(
    `targetTokenIdMaps: ${JSON.stringify(
      Object.fromEntries(targetTokenIdMaps),
    )}`,
  );
  await fetchAndPrintIdMap(
    targetTokenIdMaps,
    async (addr) => await propellerProgram.account.tokenIdMap.fetch(addr),
    // propellerProgram.account.tokenIdMap.fetch,
    "targetTokenId",
  );

  // await printTargetTokenIdMaps();
  targetChainIdMaps = await createTargetChainMaps();

  console.info(
    `targetChainIdMaps: ${JSON.stringify(
      Object.fromEntries(targetChainIdMaps),
    )}`,
  );
  // await printTargetChainMaps();
  await fetchAndPrintIdMap(
    targetChainIdMaps,
    async (addr) => await propellerProgram.account.targetChainMap.fetch(addr),
    // propellerProgram.account.targetChainMap.fetch,
    "targetChainId",
  );

  console.info(`transferring tokens`);
  await transferTokens();
}

async function getPoolInfo(): Promise<PoolInfo> {
  const poolData = await twoPoolProgram.account.twoPool.fetch(
    config.swimUsdPool,
  );
  tokenBridgeMint = poolData.lpMintKey;
  return {
    address: config.swimUsdPool,
    tokenMints: poolData.tokenMintKeys,
    tokenAccounts: poolData.tokenKeys,
    lpMint: poolData.lpMintKey,
    govFeeKey: poolData.governanceFeeKey,
  };
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

async function initializePropellerState(): Promise<PropellerInfo> {
  const propellerAddr = await getPropellerPda(
    swimUsdPoolInfo.lpMint,
    PROPELLER_PID,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerFeeVault: web3.PublicKey = await getAssociatedTokenAddress(
    tokenBridgeMint,
    propellerAddr,
    true,
  );
  const propellerRedeemer = await getPropellerRedeemerPda(PROPELLER_PID);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerRedeemerEscrow: web3.PublicKey =
    await getAssociatedTokenAddress(tokenBridgeMint, propellerRedeemer, true);
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
    await propellerProgram.methods
      .initialize(initParams)
      .accounts({
        propeller: propellerAddr,
        propellerRedeemerEscrow,
        propellerFeeVault,
        admin: propellerAdmin.publicKey,
        tokenBridgeMint,
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
      })
      .signers([propellerAdmin, payer])
      .rpc();
  }
  propellerData = await propellerProgram.account.propeller.fetch(propellerAddr);

  return {
    address: propellerAddr,
    feeVault: propellerData.feeVault,
    redeemer: propellerRedeemer,
    redeemerEscrow: propellerRedeemerEscrow,
  };
}

async function createTargetTokenIdMaps(): Promise<
  ReadonlyMap<number, web3.PublicKey>
> {
  const swimUsdTokenIdMap = {
    pool: swimUsdPoolInfo.address,
    poolTokenIndex: 0,
    poolTokenMint: swimUsdPoolInfo.lpMint,
    poolIx: { transfer: {} },
  };
  const usdcTokenIdMap = {
    pool: swimUsdPoolInfo.address,
    poolTokenIndex: 0,
    poolTokenMint: swimUsdPoolInfo.tokenMints[0],
    poolIx: { removeExactBurn: {} },
  };
  const usdtTokenIdMap = {
    pool: swimUsdPoolInfo.address,
    poolTokenIndex: 1,
    poolTokenMint: swimUsdPoolInfo.tokenMints[1],
    poolIx: { removeExactBurn: {} },
  };

  const outputTokenIdMapAddrEntries = await Promise.all(
    [
      { targetTokenId: 0, tokenIdMap: swimUsdTokenIdMap },
      { targetTokenId: 1, tokenIdMap: usdcTokenIdMap },
      { targetTokenId: 2, tokenIdMap: usdtTokenIdMap },
    ].map(async ({ targetTokenId, tokenIdMap }) => {
      const [tokenIdMapAddr] = await getTargetTokenIdMapAddr(
        propellerInfo.address,
        targetTokenId,
        propellerProgram.programId,
      );
      if (
        !(await propellerProgram.account.tokenIdMap.fetchNullable(
          tokenIdMapAddr,
        ))
      ) {
        const createTokenIdMapTxn = propellerProgram.methods
          .createTokenIdMap(
            targetTokenId,
            tokenIdMap.pool,
            tokenIdMap.poolTokenIndex,
            tokenIdMap.poolTokenMint,
            tokenIdMap.poolIx,
          )
          .accounts({
            propeller: propellerInfo.address,
            admin: propellerAdmin.publicKey,
            payer: payer.publicKey,
            systemProgram: web3.SystemProgram.programId,
            // rent: web3.SYSVAR_RENT_PUBKEY,
            pool: tokenIdMap.pool,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .signers([propellerAdmin]);
        const pubkeys = await createTokenIdMapTxn.pubkeys();
        await createTokenIdMapTxn.rpc();
        const derivedTokenIdMapAddr = pubkeys.tokenIdMap!;

        console.info(`
      derivedTokenIdMapAddr: ${derivedTokenIdMapAddr.toString()}
      tokenIdMapAddr: ${tokenIdMapAddr.toString()}
      `);
      }
      return { targetTokenId, tokenIdMapAddr };
    }),
  );
  return new Map(
    outputTokenIdMapAddrEntries.map(({ targetTokenId, tokenIdMapAddr }) => {
      return [targetTokenId, tokenIdMapAddr];
    }),
  );
}

async function fetchAndPrintIdMap(
  idMap: ReadonlyMap<number, web3.PublicKey>,
  fetchFn: (idMapAddr: web3.PublicKey) => Promise<any>,
  mapTypeName: string,
) {
  const idMapArr = Array.from(idMap.entries());
  console.info(`idMapArr: ${JSON.stringify(idMapArr)}`);
  const idMapsInfo = await Promise.all(
    idMapArr.map(async ([mapKey, mapAddr]) => {
      console.info(`mapKey: ${mapKey}, mapAddr: ${mapAddr.toString()}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mapInfo = await fetchFn(mapAddr);
      return {
        mapKey,
        address: mapAddr,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: mapInfo,
      };
    }),
  );

  idMapsInfo.forEach(({ mapKey, address, data }) => {
    console.info(`
      ${mapTypeName}: ${mapKey}
      addr: ${address.toString()}
      data: ${JSON.stringify(data)}
    `);
  });
}

async function createTargetChainMaps() {
  const targetChainMapEntries = await Promise.all(
    config.targetChains.map(async ({ targetChainId, targetAddress }) => {
      // const targetAddrWormholeFormat = tryNativeToUint8Array(targetAddress, targetChainId as ChainId)
      const targetAddrWormholeFormat = Buffer.from(
        tryNativeToHexString(targetAddress, targetChainId as ChainId),
        "hex",
      );
      const [targetChainMapAddr] = await getTargetChainIdMapAddr(
        propellerInfo.address,
        targetChainId,
        propellerProgram.programId,
      );
      const targetChainMap =
        await propellerProgram.account.targetChainMap.fetchNullable(
          targetChainMapAddr,
        );
      if (!targetChainMap) {
        await propellerProgram.methods
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .createTargetChainMap(targetChainId, targetAddrWormholeFormat)
          .accounts({
            propeller: propellerInfo.address,
            admin: propellerAdmin.publicKey,
            payer: payer.publicKey,
            targetChainMap: targetChainMapAddr,
            systemProgram: web3.SystemProgram.programId,
            // rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([propellerAdmin])
          .rpc();
      }

      return {
        targetChainId,
        targetChainMapAddr,
        // targetAddress: targetAddrWormholeFormat,
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        // targetChainMapData,
      };
    }),
  );
  return new Map(
    targetChainMapEntries.map(({ targetChainId, targetChainMapAddr }) => {
      return [targetChainId, targetChainMapAddr];
    }),
  );
}

async function transferTokens() {
  const transferAmount = new BN(100_000_000);
  const nonce = createNonce().readUInt32LE(0);
  const memo = "e45794d6c5a2750a";
  const memoBuffer = Buffer.alloc(16);
  const wormholeMessage = web3.Keypair.generate();
  const gasKickstart = false;
  const propellerEnabled = true;

  const evmTargetTokenId = 2;
  // const evmTargetTokenAddrEthHexStr = tryNativeToHexString(
  //   "0x0000000000000000000000000000000000000003",
  //   CHAIN_ID_ETH,
  // );
  // const evmTargetTokenAddr = Buffer.from(evmTargetTokenAddrEthHexStr, "hex");

  const evmOwnerEthHexStr = tryNativeToHexString(
    "0x0000000000000000000000000000000000000004",
    CHAIN_ID_ETH,
  );
  const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");
  const wormhole = config.wormholeCore;
  const tokenBridge = config.wormholeTokenBridge;
  const [custody] = await web3.PublicKey.findProgramAddress(
    [tokenBridgeMint.toBytes()],
    tokenBridge,
  );
  const [wormholeConfig] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("Bridge")],
    wormhole,
  );
  const [wormholeFeeCollector] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("fee_collector")],
    wormhole,
  );
  // wh functions return in a hex string format
  // wormholeEmitter = new web3.PublicKey(
  //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
  //   );
  const [wormholeEmitter] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("emitter")],
    tokenBridge,
  );
  const [wormholeSequence] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
    wormhole,
  );

  const [authoritySigner] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("authority_signer")],
    tokenBridge,
  );
  const [tokenBridgeConfig] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("config")],
    tokenBridge,
  );
  const [custodySigner] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("custody_signer")],
    tokenBridge,
  );
  const maxFee = new BN(100_000);
  const userTokenBridgeAccount = await getAssociatedTokenAddress(
    tokenBridgeMint,
    payer.publicKey,
  );
  const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
    // units: 420690,
    units: 900000,
    additionalFee: 0,
  });

  const transferNativeTxn = await propellerProgram.methods
    .transferNativeWithPayload(
      nonce,
      CHAIN_ID_ETH,
      transferAmount,
      // evmTargetTokenAddr,
      evmOwner,
      propellerEnabled,
      gasKickstart,
      maxFee,
      evmTargetTokenId,
      memoBuffer,
    )
    .accounts({
      propeller: propellerInfo.address,
      payer: payer.publicKey,
      tokenBridgeConfig,
      userTokenBridgeAccount,
      tokenBridgeMint,
      custody,
      tokenBridge: config.wormholeTokenBridge,
      custodySigner,
      authoritySigner,
      wormholeConfig,
      wormholeMessage: wormholeMessage.publicKey,
      wormholeEmitter,
      wormholeSequence,
      wormholeFeeCollector,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      // autoderived
      // sender
      rent: web3.SYSVAR_RENT_PUBKEY,
      // autoderived
      // systemProgram,
      wormhole,
      tokenProgram: splToken.programId,
      memo: MEMO_PROGRAM_ID,
    })
    .preInstructions([requestUnitsIx])
    .signers([payer, wormholeMessage])
    .rpc();
  console.info(`send transferNativeTxn: ${transferNativeTxn}`);
}

void setupPropeller();
// voidloadConfig();
