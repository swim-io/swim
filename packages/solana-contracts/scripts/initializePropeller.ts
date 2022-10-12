import * as fs from "fs";
import * as path from "path";

import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_ETH,
  tryHexToNativeString,
  tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import type { Idl } from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  Program,
  Spl,
  setProvider,
  web3,
} from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import type { Propeller, TwoPool } from "../src";
import { idl } from "../src";
import {
  DEFAULT_SOL_USD_FEED,
  PROPELLER_PID,
  SWIM_USD_TO_TOKEN_NUMBER,
  TWO_POOL_PID,
  USDC_TO_TOKEN_NUMBER,
  USDT_TO_TOKEN_NUMBER,
  setComputeUnitLimitIx, maxStaleness,
} from "../src/__tests__/consts";
import {
  getPropellerPda,
  getPropellerRedeemerPda,
  getTargetChainIdMapAddr,
  getTargetTokenIdMapAddr,
} from "../src/__tests__/propeller/propellerUtils";

// import type { Propeller } from "../src/artifacts/propeller";
// import type { TwoPool } from "../src/artifacts/two_pool";

const provider = AnchorProvider.env();
setProvider(provider);
const twoPoolProgram = new Program(
  idl.twoPool as Idl,
  TWO_POOL_PID,
  provider,
) as unknown as Program<TwoPool>;

const propellerProgram = new Program(
  idl.propeller as Idl,
  PROPELLER_PID,
  provider,
) as unknown as Program<Propeller>;
const splToken = Spl.token(provider);

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
  gasKickstartAmount: new BN(0.25 * web3.LAMPORTS_PER_SOL),
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
  readonly wormholeChainId: number;
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
  console.info(
    `Using config: ${JSON.stringify(
      {
        swimUsdPool: config.swimUsdPool,
        wormholeCore: config.wormholeCore,
        wormholeTokenBridge: config.wormholeTokenBridge,
      },
      null,
      2,
    )}`,
  );
  console.table(config.targetChains);
  swimUsdPoolInfo = await getPoolInfo();
  swimUsdMint = swimUsdPoolInfo.lpMint;
  console.info(`swimUsdPoolInfo: ${JSON.stringify(swimUsdPoolInfo)}`);
  propellerInfo = await initializePropellerState();
  console.info(`propellerInfo: ${JSON.stringify(propellerInfo, null, 2)}`);
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
  const targetChainIdMapData = await fetchAndPrintIdMap(
    targetChainIdMaps,
    async (addr) => await propellerProgram.account.targetChainMap.fetch(addr),
    // propellerProgram.account.targetChainMap.fetch,
    "targetChainId",
  );
  //(_, _, data): (_, _, {bump: number, targetChain: number, targetAddress: Buffer}
  const formattedTargetChainIdMapData = targetChainIdMapData.map(
    ({ address, data }) => {
      return {
        targetChainIdMapAddr: address.toString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        wormholeChainId: data.targetChain,
        targetAddress: tryHexToNativeString(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
          data.targetAddress,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
          data.targetChain,
        ),
      };
    },
  );

  console.table(formattedTargetChainIdMapData);
  console.info(`transferring tokens`);
  await transferTokens();
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
    maxStaleness: maxStaleness,
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
    console.info(`no propeller data found. initializing`);
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
  }
  propellerData = await propellerProgram.account.propeller.fetch(propellerAddr);
  console.info(`propellerState:
  ${JSON.stringify({ key: propellerAddr, ...propellerData }, null, 2)}
  `);
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
      {
        targetTokenId: SWIM_USD_TO_TOKEN_NUMBER,
        tokenIdMap: swimUsdTokenIdMap,
      },
      { targetTokenId: USDC_TO_TOKEN_NUMBER, tokenIdMap: usdcTokenIdMap },
      { targetTokenId: USDT_TO_TOKEN_NUMBER, tokenIdMap: usdtTokenIdMap },
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
        const derivedTokenIdMapAddr = pubkeys.tokenIdMap;
        if (!derivedTokenIdMapAddr) {
          throw new Error("Failed to derive tokenIdMapAddr");
        }

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
  return idMapsInfo;
}

async function createTargetChainMaps() {
  const targetChainMapEntries = await Promise.all(
    config.targetChains.map(async ({ wormholeChainId, targetAddress }) => {
      // const targetAddrWormholeFormat = tryNativeToUint8Array(targetAddress, targetChainId as ChainId)
      const targetAddrWormholeFormat = Buffer.from(
        tryNativeToHexString(targetAddress, wormholeChainId as ChainId),
        "hex",
      );
      const [targetChainMapAddr] = await getTargetChainIdMapAddr(
        propellerInfo.address,
        wormholeChainId,
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
          .createTargetChainMap(wormholeChainId, targetAddrWormholeFormat)
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
        wormholeChainId,
        targetChainMapAddr,
        // targetAddress: targetAddrWormholeFormat,
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        // targetChainMapData,
      };
    }),
  );
  return new Map(
    targetChainMapEntries.map(({ wormholeChainId, targetChainMapAddr }) => {
      return [wormholeChainId, targetChainMapAddr];
    }),
  );
}

async function transferTokens() {
  const transferAmount = new BN(100_000_000);
  const gasKickstart = true;
  const evmOwnerNative = "0xd791AAfc9a0bb703A22Aebc0c5d2a9601Bbe3F44";

  //EVM dev wallet
  const evmOwnerEthHexStr = tryNativeToHexString(evmOwnerNative, CHAIN_ID_ETH);
  const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");
  const wormhole = config.wormholeCore;
  const tokenBridge = config.wormholeTokenBridge;
  const [custody] = await web3.PublicKey.findProgramAddress(
    [swimUsdMint.toBytes()],
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
  const maxFee = new BN(100);

  const userSwimUsdAta: web3.PublicKey = await getAssociatedTokenAddress(
    swimUsdMint,
    payer.publicKey,
  );

  let memo = 0;
  // const evmTargetTokenIds = [0, 1];
  const evmTargetTokenIds = [0];
  const targetChain = CHAIN_ID_ETH;
  // const targetChain = CHAIN_ID_BSC;
  await Promise.all(
    evmTargetTokenIds.map(async (evmTargetTokenId) => {
      // console.info(
      //   `sending crossChainTransferNativeWithPayload(
      //   targetTokenId: ${evmTargetTokenId},
      //   targetChain: ${targetChain},
      //   targetOwner(native): ${evmOwnerNative},
      //   targetOwner(Hex): ${evmOwnerEthHexStr},
      // )
      // `,
      // );
      //
      // const crossChainTransferNativeWithPayloadTxnSig: string =
      //   await propellerProgram.methods
      //     .crossChainTransferNativeWithPayload(
      //       transferAmount,
      //       targetChain,
      //       evmOwner,
      //     )
      //     .accounts({
      //       propeller: propellerInfo.address,
      //       payer: payer.publicKey,
      //       tokenBridgeConfig,
      //       userSwimUsdAta: userSwimUsdAta,
      //       swimUsdMint,
      //       custody,
      //       tokenBridge: config.wormholeTokenBridge,
      //       custodySigner,
      //       authoritySigner,
      //       wormholeConfig,
      //       wormholeMessage: wormholeMessage.publicKey,
      //       wormholeEmitter,
      //       wormholeSequence,
      //       wormholeFeeCollector,
      //       clock: web3.SYSVAR_CLOCK_PUBKEY,
      //       // autoderived
      //       // sender
      //       rent: web3.SYSVAR_RENT_PUBKEY,
      //       // autoderived
      //       // systemProgram,
      //       wormhole,
      //       tokenProgram: splToken.programId,
      //     })
      //     .preInstructions([setComputeUnitLimitIx])
      //     .signers([payer, wormholeMessage])
      //     .rpc();
      // console.info(
      //   `
      //   targetTokenId: ${evmTargetTokenId},
      //   crossChainTransferNativeWithPayloadTxnSig: ${crossChainTransferNativeWithPayloadTxnSig}`,
      // );

      const memoStr = (++memo).toString().padStart(16, "0");
      const memoBuffer2 = Buffer.alloc(16);
      memoBuffer2.write(memoStr);

      const propellerEnabledTransferAmount = transferAmount.div(new BN(2));
      const propellerEnabledWormholeMessage = web3.Keypair.generate();

      console.info(`
    calling propellerTransferNativeWithPayload(
      amount: ${propellerEnabledTransferAmount.toString()},
      gasKickstart: ${gasKickstart.toString()},
      maxFee: ${maxFee.toString()},
      targetTokenId: ${evmTargetTokenId},
      targetChain: ${targetChain},
      targetOwner(native): ${evmOwnerNative},
      targetOwner(Hex): ${evmOwnerEthHexStr},
      memo(str): ${memoStr},
      memo(buffer): ${memoBuffer2.toString("hex")},
    )
  `);

      const propellerTransferNativeWithPayloadTxnSig: string =
        await propellerProgram.methods
          .propellerTransferNativeWithPayload(
            propellerEnabledTransferAmount,
            targetChain,
            evmOwner,
            gasKickstart,
            maxFee,
            evmTargetTokenId,
            memoBuffer2,
          )
          .accounts({
            propeller: propellerInfo.address,
            payer: payer.publicKey,
            tokenBridgeConfig,
            userSwimUsdAta: userSwimUsdAta,
            swimUsdMint,
            custody,
            tokenBridge: config.wormholeTokenBridge,
            custodySigner,
            authoritySigner,
            wormholeConfig,
            wormholeMessage: propellerEnabledWormholeMessage.publicKey,
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
          })
          .preInstructions([setComputeUnitLimitIx])
          .postInstructions([createMemoInstruction(memoStr)])
          .signers([payer, propellerEnabledWormholeMessage])
          .rpc();

      console.info(
        `propellerTransferNativeWithPayloadTxnSig: ${propellerTransferNativeWithPayloadTxnSig}`,
      );
    }),
  );
}

void setupPropeller();
// voidloadConfig();
