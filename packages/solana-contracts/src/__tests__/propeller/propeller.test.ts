import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryNativeToHexString,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import type { Program } from "@project-serum/anchor";
// eslint-disable-next-line import/order
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
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as byteify from "byteify";

import type { Propeller } from "../../artifacts/propeller";
import type { TwoPool } from "../../artifacts/two_pool";
import { getApproveAndRevokeIxs } from "../../index";
import {
  getPoolUserBalances,
  printBeforeAndAfterPoolUserBalances,
  printPoolUserBalances,
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  getPropellerPda,
  getPropellerRedeemerPda,
  getPropellerSenderPda,
  parseTokenTransferWithSwimPayloadPostedMessage,
} from "./propellerUtils";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeTokenTransferWithPayload,
  formatParsedTokenTransferPostedMessage,
} from "./tokenBridgeUtils";
import {
  WORMHOLE_CORE_BRIDGE,
  WORMHOLE_TOKEN_BRIDGE,
  signAndEncodeVaa,
} from "./wormholeUtils";

// this just breaks everything for some reason...
//  think it was something related to the cjs/esm stuff for spl-memo
//
// const MEMO_PROGRAM_ID: PublicKey = new PublicKey(
//   "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
// );
setDefaultWasm("node");
// const pr2 = new AnchorProvider(
// 	connection,
// 	provider.wallet,
// 	{
// 		commitment: "confirmed",
// 	}
// )
// const process = require("process");
// const url = process.env.ANCHOR_PROVIDER_URL;
// const provider = AnchorProvider.local(url, {commitment: "confirmed"});
const envProvider = AnchorProvider.env();

// const confirmedCommitment = { commitment: "confirmed" as web3.Finality };
const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};
const provider = new AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig,
);
const connection = provider.connection;
const payer = (provider.wallet as NodeWallet).payer;
const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
setProvider(provider);

const propellerProgram = workspace.Propeller as Program<Propeller>;
const twoPoolProgram = workspace.TwoPool as Program<TwoPool>;

const wormhole = WORMHOLE_CORE_BRIDGE;
const tokenBridge = WORMHOLE_TOKEN_BRIDGE;

let ethTokenBridgeSequence = 0;
// let ethTokenBridgeSequence = BigInt(0);

const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(
  ethTokenBridgeStr,
  CHAIN_ID_ETH,
);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");

const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
// const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(
//   ethRoutingContractStr,
//   CHAIN_ID_ETH,
// );
// console.info(`
// ethRoutingContractEthUint8Arr: ${ethRoutingContractEthUint8Arr}
// Buffer.from(ethRoutingContractEthUint8Arr): ${Buffer.from(
//   ethRoutingContractEthUint8Arr,
// )}
// `);
const ethRoutingContractEthHexStr = tryNativeToHexString(
  ethRoutingContractStr,
  CHAIN_ID_ETH,
);
const ethRoutingContract = Buffer.from(ethRoutingContractEthHexStr, "hex");

const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  // units: 420690,
  units: 900000,
  additionalFee: 0,
});

let metapool: web3.PublicKey;
// let metapoolData: SwimPoolState;
// let metapoolAuth: web3.PublicKey;
let userMetapoolTokenAccount0: web3.PublicKey;
let userMetapoolTokenAccount1: web3.PublicKey;
let userMetapoolLpTokenAccount: web3.PublicKey;

let propeller: web3.PublicKey;
let propellerSender: web3.PublicKey;
let propellerRedeemer: web3.PublicKey;
let propellerRedeemerEscrowAccount: web3.PublicKey;
const propellerAdmin: web3.Keypair = web3.Keypair.generate();
let propellerFeeVault: web3.PublicKey;

const dummyUser = payer;
const initialMintAmount = 100_000_000_000_000;
// const usdcMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: dummyUser.publicKey,
// };
// const usdtMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: dummyUser.publicKey
// };

const mintDecimal = 6;

const usdcKeypair = web3.Keypair.generate();
const usdtKeypair = web3.Keypair.generate();
const poolMintKeypairs = [usdcKeypair, usdtKeypair];
const poolMintDecimals = [mintDecimal, mintDecimal];
const poolMintAuthorities = [payer, payer];
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();
const pauseKeypair = web3.Keypair.generate();

let poolUsdcAtaAddr: web3.PublicKey;
let poolUsdtAtaAddr: web3.PublicKey;
let flagshipPoolGovernanceFeeAcct: web3.PublicKey;

let userUsdcAtaAddr: web3.PublicKey;
let userUsdtAtaAddr: web3.PublicKey;
let userSwimUsdAtaAddr: web3.PublicKey;
const ampFactor = { value: new BN(300), decimals: 0 };
const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey;
// let flagshipPoolData: SwimPoolState;
// let poolAuth: web3.PublicKey;
const tokenBridgeMint: web3.PublicKey = swimUsdKeypair.publicKey;

const metapoolMint0Keypair = swimUsdKeypair;
const metapoolMint1Keypair = web3.Keypair.generate();
const metapoolMint1Authority = payer;
const metapoolMint1Decimal = 8;
const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];
// const metapoolMintAuthorities = [flagshipPool, metapoolMint1Authority];

const metapoolLpMintKeypair = web3.Keypair.generate();
const metapoolLpMint = metapoolLpMintKeypair.publicKey;
let metapoolPoolToken0Ata: web3.PublicKey;
let metapoolPoolToken1Ata: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
const secpVerifyInitFee: BN = new BN(0.000045 * LAMPORTS_PER_SOL);
const secpVerifyFee: BN = new BN(0.00004 * LAMPORTS_PER_SOL);
const postVaaFee: BN = new BN(0.00005 * LAMPORTS_PER_SOL);
const completeWithPayloadFee: BN = new BN(0.0000055 * LAMPORTS_PER_SOL);
const processSwimPayloadFee: BN = new BN(0.00001 * LAMPORTS_PER_SOL);
const propellerMinTransferAmount = new BN(5_000_000);
const propellerEthMinTransferAmount = new BN(10_000_000);
let marginalPricePool: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

const swimPayloadVersion = 0;

const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
const usdcPoolTokenIndex = 0;
const usdtOutputTokenIndex = 2;
const usdtPoolTokenIndex = 1;
const metapoolMint1OutputTokenIndex = 3;
const metapoolMint1PoolTokenIndex = 1;
let outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey>;
let memoId = 0;
// const poolRemoveExactBurnIx = {removeExactBurn: {} };
// const poolSwapExactInputIx = {swapExactInput: {} };
// type TokenIdMapPoolIx = poolRemoveExactBurnIx | poolSwapExactInputIx;
// type TokenIdMapPoolIx2 = "removeExactBurn" | "swapExactInput";
// type PoolIx = {
//   readonly [key in TokenIdMapPoolIx2]?: Record<string, never>;
// };
// type TokenIdMap = {
//   readonly pool: web3.PublicKey;
//   readonly poolTokenIndex: number;
//   readonly poolTokenMint: web3.PublicKey;
//   readonly poolIx: PoolIx;
// };
// type TokenIdMapping = {
//
// }
// let usdcTokenIdMap: TokenIdMap;
// let usdtTokenIdMap: TokenIdMap;
// // let metapoolMint1TokenIdMap: TokenIdMap;
// let outputTokenIdMappings: ReadonlyMap<number, TokenIdMap>;

// let swimUSDMintInfo: MintInfo;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey;
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;

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

const propellerEngineKeypair: web3.Keypair = web3.Keypair.generate();

describe("propeller", () => {
  beforeAll(async () => {
    console.info(`initializing two pool v2`);
    ({
      poolPubkey: flagshipPool,
      poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
      governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      poolMintKeypairs,
      poolMintDecimals,
      poolMintAuthorities.map((k) => k.publicKey),
      swimUsdKeypair.publicKey,
      governanceKeypair.publicKey,
    ));
    const initFlagshipPoolTxn = twoPoolProgram.methods
      // .initialize(params)
      .initialize(ampFactor, lpFee, governanceFee)
      .accounts({
        payer: provider.publicKey,
        poolMint0: usdcKeypair.publicKey,
        poolMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([swimUsdKeypair]);

    const pubkeys = await initFlagshipPoolTxn.pubkeys();
    console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
    if (!pubkeys.pool) {
      throw new Error("Missing Pool Pubkey");
    }
    const pool = pubkeys.pool;
    console.info(
      `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
    );

    // expect(pool.toBase58()).toEqual(flagshipPool.toBase58());
    const initFlagshipPoolTxnSig: string = await initFlagshipPoolTxn.rpc(
      rpcCommitmentConfig,
    );

    console.info(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

    const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.info(
      `flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`,
    );

    marginalPricePool = flagshipPool;

    // const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
    //   [
    //     Buffer.from("two_pool"),
    //     ...poolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //     swimUsdKeypair.publicKey.toBytes(),
    //     Buffer.from([flagshipPoolData.bump]),
    //   ],
    //   twoPoolProgram.programId,
    // );
    // expect(flagshipPool.toBase58()).toEqual(calculatedSwimPoolPda.toBase58());

    console.info(`setting up user token accounts for flagship pool`);
    ({
      userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
      userLpTokenAta: userSwimUsdAtaAddr,
    } = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      poolMintKeypairs.map((kp) => kp.publicKey),
      poolMintAuthorities,
      swimUsdKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig,
    ));

    console.info(
      `done setting up flagship pool and relevant user token accounts`,
    );
    console.info(`
      flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
      user: {
        userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
        userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
        userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
      }
    `);

    console.info(`metapool initializeV2 `);

    // const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
    //   [
    //     Buffer.from("two_pool"),
    //     ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //     metapoolLpMintKeypair.publicKey.toBytes(),
    //   ],
    //   twoPoolProgram.programId,
    // );

    ({
      poolPubkey: metapool,
      poolTokenAccounts: [metapoolPoolToken0Ata, metapoolPoolToken1Ata],
      governanceFeeAccount: metapoolGovernanceFeeAta,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      metapoolMintKeypairs,
      metapoolMintDecimals,
      [flagshipPool, metapoolMint1Authority.publicKey],
      // [metapoolMint1Keypair],
      // [metapoolMint1Decimal],
      // [metapoolMint1Authority.publicKey],
      metapoolLpMintKeypair.publicKey,
      governanceKeypair.publicKey,
    ));

    const initMetapoolTxn = twoPoolProgram.methods
      // .initialize(params)
      .initialize(ampFactor, lpFee, governanceFee)
      .accounts({
        payer: provider.publicKey,
        poolMint0: metapoolMintKeypairs[0].publicKey,
        poolMint1: metapoolMintKeypairs[1].publicKey,
        lpMint: metapoolLpMintKeypair.publicKey,
        poolTokenAccount0: metapoolPoolToken0Ata,
        poolTokenAccount1: metapoolPoolToken1Ata,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: metapoolGovernanceFeeAta,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([metapoolLpMintKeypair]);
    // .rpc({skipPreflight: true});
    // console.info(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);

    const initMetapoolTxnPubkeys = await initMetapoolTxn.pubkeys();
    console.info(
      `initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`,
    );

    if (!initMetapoolTxnPubkeys.pool) {
      throw new Error(
        "Pool pubkey from initMetapoolTxnPubkeys not auto-derived",
      );
    }
    const derivedMetapool = initMetapoolTxnPubkeys.pool;
    console.info(
      `derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`,
    );
    // expect(metapoolPda.toBase58()).toEqual(derivedMetapool.toBase58());
    // expect(derivedMetapool.toBase58()).toEqual(metapool.toBase58());

    const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

    console.info(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

    const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
    console.info(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
    // expect(metapoolBump).toEqual(metapoolData.bump);

    // const calculatedMetapoolPda: web3.PublicKey =
    //   await web3.PublicKey.createProgramAddress(
    //     [
    //       Buffer.from("two_pool"),
    //       ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //       metapoolLpMintKeypair.publicKey.toBytes(),
    //       Buffer.from([metapoolData.bump]),
    //     ],
    //     twoPoolProgram.programId,
    //   );
    // expect(metapool.toBase58()).toEqual(calculatedMetapoolPda.toBase58());

    userMetapoolTokenAccount0 = userSwimUsdAtaAddr;

    // userMetapoolTokenAccount0 = (
    //   await getOrCreateAssociatedTokenAccount(
    //     provider.connection,
    //     payer,
    //     metapoolLpMintKeypair.publicKey,
    //     dummyUser.publicKey,
    //     false,
    //     commitment,
    //     rpcCommitmentConfig,
    //   )
    // ).address;

    ({
      userPoolTokenAtas: [userMetapoolTokenAccount1],
      userLpTokenAta: userMetapoolLpTokenAccount,
    } = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      [metapoolMint1Keypair.publicKey],
      [metapoolMint1Authority],
      metapoolLpMintKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig,
    ));

    console.info(`Done setting up metapool & relevant user token accounts`);
    console.info(`
      metapool: ${JSON.stringify(metapoolData, null, 2)}
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);

    // [custodyOrWrappedMeta] = await (async () => {
    //     const mintInfo = await getMint(program.provider.connection, tokenBridgeMint);
    //     if (mintInfo.mintAuthority! === tokenMintSigner) {
    //         //First derive the Wrapped Mint Key
    //         //[Ricky] - this call is propellerLpAta wormhole-sdk
    //         const nativeInfo = await getOriginalAssetSol(
    //             program.provider.connection,
    //             tokenBridge.toString(),
    //             tokenBridgeMint.toString()
    //         );
    //         const [wrappedMintKey] = await web3.PublicKey.findProgramAddress(
    //             [
    //                 Buffer.from("wrapped"),
    //                 // serializeuint16 as uint8array
    //                 // ` data.token_chain.to_be_bytes().to_vec(),`
    //                 serializeUint16(nativeInfo.chainId as number),
    //                 tokenBridgeMint.toBytes()
    //             ],
    //             tokenBridge
    //         );
    //         //Then derive the Wrapped Meta Key
    //         return await web3.PublicKey.findProgramAddress([Buffer.from("meta"), wrappedMintKey.toBytes()], tokenBridge);
    //     } else {
    //         // transfer native sol asset
    //         return await web3.PublicKey.findProgramAddress([tokenBridgeMint.toBytes()], tokenBridge);
    //     }
    // })();

    // note - there's also wasm generated helper methods to derive these addresses as well.
    // assuming always sending solana native token so this will be custody.
    [custody] = await (async () => {
      return await web3.PublicKey.findProgramAddress(
        [tokenBridgeMint.toBytes()],
        tokenBridge,
      );
    })();

    [wormholeConfig] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("Bridge")],
      wormhole,
    );
    [wormholeFeeCollector] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("fee_collector")],
      wormhole,
    );
    // wh functions return in a hex string format
    // wormholeEmitter = new web3.PublicKey(
    //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
    //   );
    [wormholeEmitter] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("emitter")],
      tokenBridge,
    );
    [wormholeSequence] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
      wormhole,
    );

    [authoritySigner] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("authority_signer")],
      tokenBridge,
    );
    [tokenBridgeConfig] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("config")],
      tokenBridge,
    );
    [custodySigner] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("custody_signer")],
      tokenBridge,
    );

    console.info(`
            custodyOrWrappedMeta: ${custody.toString()}
            wormholeConfig: ${wormholeConfig.toString()}
            wormholeFeeCollector: ${wormholeFeeCollector.toString()}
            wormholeEmitter: ${wormholeEmitter.toString()}
            wormholeSequence: ${wormholeSequence.toString()}
            authoritySigner: ${authoritySigner.toString()}
            tokenBridgeConfig: ${tokenBridgeConfig.toString()}
            custodySigner: ${custodySigner.toString()}
        `);

    await connection.requestAirdrop(
      propellerEngineKeypair.publicKey,
      10 * LAMPORTS_PER_SOL,
    );

    // console.info(`setting up switchboard`);
    // // If fails, fallback to looking for a local env file
    // try {
    // 	switchboard = await SwitchboardTestContext.loadFromEnv(provider);
    // 	const aggregatorAccount = await switchboard.createStaticFeed(100);
    // 	aggregatorKey = aggregatorAccount.publicKey ?? PublicKey.default;
    // 	console.info("local env detected");
    // 	return;
    // } catch (error: any) {
    // 	console.info(`Error: SBV2 Localnet - ${error.message}`);
    // 	throw new Error(`Failed to load localenv SwitchboardTestContext: ${error.message}`);
    // }
  }, 30000);

  it("Initializes propeller", async () => {
    const expectedPropellerAddr = await getPropellerPda(
      tokenBridgeMint,
      propellerProgram.programId,
    );
    const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
      propellerProgram.programId,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    propellerFeeVault = await getAssociatedTokenAddress(
      tokenBridgeMint,
      expectedPropellerAddr,
      true,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const propellerRedeemerEscrowAddr: web3.PublicKey =
      await getAssociatedTokenAddress(
        tokenBridgeMint,
        expectedPropellerRedeemerAddr,
        true,
      );
    const initializeParams = {
      gasKickstartAmount,
      propellerFee,
      secpVerifyInitFee,
      secpVerifyFee,
      postVaaFee,
      completeWithPayloadFee,
      processSwimPayloadFee,
      propellerMinTransferAmount,
      propellerEthMinTransferAmount,
      marginalPricePool,
      marginalPricePoolTokenIndex,
      marginalPricePoolTokenMint,
      evmRoutingContractAddress: ethRoutingContract,
      // evmRoutingContractAddress: ethRoutingContractEthUint8Arr
    };
    const tx = propellerProgram.methods
      .initialize(initializeParams)
      .accounts({
        propellerRedeemerEscrow: propellerRedeemerEscrowAddr,
        propellerFeeVault,
        admin: propellerAdmin.publicKey,
        tokenBridgeMint,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        pool: flagshipPool,
        poolTokenMint0: usdcKeypair.publicKey,
        poolTokenMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        twoPoolProgram: twoPoolProgram.programId,
      })
      .signers([propellerAdmin]);

    const pubkeys = await tx.pubkeys();
    console.info(`pubkeys: ${JSON.stringify(pubkeys, null, 2)}`);
    if (!pubkeys.propeller) {
      throw new Error("Propeller PDA Address was not auto-derived");
    }
    propeller = pubkeys.propeller;
    console.info(`propeller: ${propeller.toBase58()}`);
    if (!pubkeys.propellerSender) {
      throw new Error("Propeller Sender PDA Address was not auto-derived");
    }
    propellerSender = pubkeys.propellerSender;

    if (!pubkeys.propellerRedeemer) {
      throw new Error("Propeller Redeemer PDA Address was not auto-derived");
    }
    propellerRedeemer = pubkeys.propellerRedeemer;
    // propellerRedeemerEscrowAccount = await getOrCreateAssociatedTokenAccount(
    // 	connection,
    // 	payer,
    // 	tokenBridgeMint,
    // 	propellerRedeemer,
    // 	true
    // );

    // if (pubkeys.propellerRedeemerEscrow) {
    // 	propellerRedeemerEscrowAccount = pubkeys.propellerRedeemerEscrow;
    // } else {
    // 	assert.ok(false);
    // }

    const txSig = await tx.rpc({ skipPreflight: true });
    await connection.confirmTransaction({
      signature: txSig,
      ...(await connection.getLatestBlockhash()),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    propellerRedeemerEscrowAccount = (
      await getAccount(connection, propellerRedeemerEscrowAddr)
    ).address;
    // propellerRedeemerEscrowAccount = await getAccount(connection,propellerRedeemerEscrowAddr);
    // .then((address) => getAccount(connection, address));

    // const propellerData = await propellerProgram.account.propeller.fetch(propeller);
    expect(expectedPropellerAddr).toEqual(propeller);

    const expectedPropellerSenderAddr = await getPropellerSenderPda(
      propellerProgram.programId,
    );
    expect(propellerSender).toEqual(expectedPropellerSenderAddr);

    expect(propellerRedeemer).toEqual(expectedPropellerRedeemerAddr);

    const propellerAcct = await connection.getAccountInfo(propeller);
    console.info(`propellerAcct.owner: ${propellerAcct.owner.toBase58()}`);

    const propellerData = await propellerProgram.account.propeller.fetch(
      propeller,
    );
    console.info(`propellerData: ${JSON.stringify(propellerData)}`);
    expect(propellerData.admin).toEqual(propellerAdmin.publicKey);
    expect(propellerData.tokenBridgeMint).toEqual(tokenBridgeMint);

    console.info(`propellerFee: ${propellerData.propellerFee.toString()}`);
    console.info(
      `gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`,
    );
    console.info(
      `propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`,
    );
    expect(propellerData.propellerFee.eq(propellerFee)).toEqual(true);
    expect(propellerData.gasKickstartAmount.eq(gasKickstartAmount)).toEqual(
      true,
    );
    expect(
      propellerData.propellerMinTransferAmount.eq(propellerMinTransferAmount),
    ).toEqual(true);
    console.info(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.toBase58()}
		`);
  });

  it("Creates Token Id Mappings", async () => {
    const swimUsdTokenIdMap = {
      pool: flagshipPool,
      poolTokenIndex: 0,
      poolTokenMint: swimUsdKeypair.publicKey,
      poolIx: { transfer: {} },
    };
    const usdcTokenIdMap = {
      pool: flagshipPool,
      poolTokenIndex: usdcPoolTokenIndex,
      poolTokenMint: usdcKeypair.publicKey,
      poolIx: { removeExactBurn: {} },
    };
    const usdtTokenIdMap = {
      pool: flagshipPool,
      poolTokenIndex: usdtPoolTokenIndex,
      poolTokenMint: usdtKeypair.publicKey,
      poolIx: { removeExactBurn: {} },
    };
    const metapoolMint1TokenIdMap = {
      pool: metapool,
      poolTokenIndex: metapoolMint1PoolTokenIndex,
      poolTokenMint: metapoolMint1Keypair.publicKey,
      poolIx: { swapExactInput: {} },
    };

    const outputTokenIdMapAddrEntries = await Promise.all(
      [
        {
          outputTokenIndex: swimUsdOutputTokenIndex,
          tokenIdMap: swimUsdTokenIdMap,
        },
        { outputTokenIndex: usdcOutputTokenIndex, tokenIdMap: usdcTokenIdMap },
        { outputTokenIndex: usdtOutputTokenIndex, tokenIdMap: usdtTokenIdMap },
        {
          outputTokenIndex: metapoolMint1OutputTokenIndex,
          tokenIdMap: metapoolMint1TokenIdMap,
        },
      ].map(async ({ outputTokenIndex, tokenIdMap }) => {
        const createTokenIdMappingTxn = propellerProgram.methods
          .createTokenIdMap(
            outputTokenIndex,
            tokenIdMap.pool,
            tokenIdMap.poolTokenIndex,
            tokenIdMap.poolTokenMint,
            tokenIdMap.poolIx,
          )
          .accounts({
            propeller,
            admin: propellerAdmin.publicKey,
            payer: payer.publicKey,
            systemProgram: web3.SystemProgram.programId,
            // rent: web3.SYSVAR_RENT_PUBKEY,
            pool: tokenIdMap.pool,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .signers([propellerAdmin]);

        const pubkeys = await createTokenIdMappingTxn.pubkeys();
        if (!pubkeys.tokenIdMap) {
          throw new Error("Token Id Map PDA Address was not auto-derived");
        }
        const tokenIdMapAddr = pubkeys.tokenIdMap;
        expect(tokenIdMapAddr).toBeTruthy();

        const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
          await web3.PublicKey.findProgramAddress(
            [
              Buffer.from("propeller"),
              Buffer.from("token_id"),
              propeller.toBuffer(),
              new BN(outputTokenIndex).toArrayLike(Buffer, "le", 2),
              // byteify.serializeUint16(usdcOutputTokenIndex),
            ],
            propellerProgram.programId,
          );
        expect(tokenIdMapAddr).toEqual(calculatedTokenIdMap);
        await createTokenIdMappingTxn.rpc();

        const fetchedTokenIdMap =
          await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr);
        expect(fetchedTokenIdMap.outputTokenIndex).toEqual(outputTokenIndex);
        expect(fetchedTokenIdMap.pool).toEqual(tokenIdMap.pool);
        expect(fetchedTokenIdMap.poolTokenIndex).toEqual(
          tokenIdMap.poolTokenIndex,
        );
        expect(fetchedTokenIdMap.poolTokenMint).toEqual(
          tokenIdMap.poolTokenMint,
        );
        expect(fetchedTokenIdMap.poolIx).toEqual(tokenIdMap.poolIx);
        expect(fetchedTokenIdMap.bump).toEqual(calculatedTokenIdMapBump);
        return { outputTokenIndex, tokenIdMapAddr };
      }),
    );

    outputTokenIdMappingAddrs = new Map(
      outputTokenIdMapAddrEntries.map(
        ({ outputTokenIndex, tokenIdMapAddr }) => {
          return [outputTokenIndex, tokenIdMapAddr];
        },
      ),
    );
    for (const [
      outputTokenIndex,
      tokenIdMapAddr,
    ] of outputTokenIdMappingAddrs.entries()) {
      console.info(`
        outputTokenIndex: ${outputTokenIndex}
        tokenIdMapAddr: ${tokenIdMapAddr.toBase58()}
        tokenIdMap: ${JSON.stringify(
          await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr),
        )}
      `);
    }
  });

  describe("Propeller Pool Ixs", () => {
    describe("Propeller Flagship Pool ixs", () => {
      it("Propeller Add (non propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          poolUsdcAtaAddr,
          poolUsdtAtaAddr,
          flagshipPoolGovernanceFeeAcct,
          userUsdcAtaAddr,
          userUsdtAtaAddr,
          userSwimUsdAtaAddr,
          flagshipPool,
          swimUsdKeypair.publicKey,
        );

        const inputAmounts = [
          new BN(50_000_000_000_000),
          new BN(50_000_000_000_000),
        ];
        const minimumMintAmount = new BN(0);
        const propellerEnabled = false;
        // const addParams = {
        //   inputAmounts,
        //   minimumMintAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userUsdcAtaAddr, userUsdtAtaAddr],
          inputAmounts,
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);

        const addTxn = propellerProgram.methods
          .add(
            inputAmounts,
            minimumMintAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            propeller: propeller,
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
            governanceFee: flagshipPoolGovernanceFeeAcct,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userUsdcAtaAddr,
            userTokenAccount1: userUsdtAtaAddr,
            userLpTokenAccount: userSwimUsdAtaAddr,
            tokenProgram: splToken.programId,
            memo: MEMO_PROGRAM_ID,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

        const addTxnPubkeys = await addTxn.pubkeys();
        console.info(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

        const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

        console.info(`addTxSig: ${addTxnSig}`);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          poolUsdcAtaAddr,
          poolUsdtAtaAddr,
          flagshipPoolGovernanceFeeAcct,
          userUsdcAtaAddr,
          userUsdtAtaAddr,
          userSwimUsdAtaAddr,
          flagshipPool,
          swimUsdKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances(
          "add (non propeller-enabled) balances",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolUsdcAtaBalanceBefore,
            poolUsdtAtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userUsdcAtaBalanceBefore,
            userUsdtAtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore)).toEqual(
          true,
        );
        expect(poolUsdtAtaBalanceAfter.gt(poolUsdtAtaBalanceBefore)).toEqual(
          true,
        );
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(userUsdcAtaBalanceAfter.lt(userUsdcAtaBalanceBefore)).toEqual(
          true,
        );
        expect(userUsdtAtaBalanceAfter.lt(userUsdtAtaBalanceBefore)).toEqual(
          true,
        );
        expect(userLpTokenBalanceAfter.gt(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(previousDepthAfter.gt(previousDepthBefore)).toEqual(true);
        await checkTxnLogsForMemo(addTxnSig, memoStr);
      });

      it("Propeller add fails when propeller enabled & output amount is insufficient for target chain", async () => {
        const inputAmounts = [new BN(100), new BN(100)];
        const minimumMintAmount = new BN(0);
        const propellerEnabled = true;
        // const addParams = {
        //   inputAmounts,
        //   minimumMintAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userUsdcAtaAddr, userUsdtAtaAddr],
          inputAmounts,
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);

        await expect(() => {
          return propellerProgram.methods
            .add(
              inputAmounts,
              minimumMintAmount,
              memo,
              propellerEnabled,
              CHAIN_ID_ETH,
            )
            .accounts({
              propeller: propeller,
              poolTokenAccount0: poolUsdcAtaAddr,
              poolTokenAccount1: poolUsdtAtaAddr,
              lpMint: swimUsdKeypair.publicKey,
              governanceFee: flagshipPoolGovernanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userUsdcAtaAddr,
              userTokenAccount1: userUsdtAtaAddr,
              userLpTokenAccount: userSwimUsdAtaAddr,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
            })
            .preInstructions([...approveIxs])
            .postInstructions([...revokeIxs])
            .signers([userTransferAuthority])
            .rpc();
        }).rejects.toThrow("Insufficient Amount being transferred");
      });
    });

    describe("Propeller Metapool Pool ixs", () => {
      beforeAll(async () => {
        console.info("seeding metapool");
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printPoolUserBalances(
          "seeding metapool balances before",
          poolUserBalancesBefore,
        );
        const uiInputAmounts: readonly BN[] = [new BN(2_000), new BN(1_500)];
        const inputAmounts: readonly BN[] = uiInputAmounts.map(
          (bn: BN, i: number) => {
            const powerOfTen = new BN(10).pow(new BN(metapoolMintDecimals[i]));
            return bn.mul(powerOfTen);
          },
        );
        console.info(
          `inputAmounts: ${JSON.stringify(
            inputAmounts.map((x) => x.toString()),
          )}`,
        );
        // const inputAmounts = [
        //   //100_000_000_000
        //   new BN(2_000_000_000_000),
        //   //100_000_000_000_000
        //   new BN(1_000_000_000_000),
        // ];
        const minimumMintAmount = new BN(0);
        // const addParams = {
        //   inputAmounts,
        //   minimumMintAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
          inputAmounts,
          userTransferAuthority.publicKey,
          payer,
        );
        const seedMetapoolTxn = await twoPoolProgram.methods
          .add(inputAmounts, minimumMintAmount)
          .accounts({
            // propeller: propeller,
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            userLpTokenAccount: userMetapoolLpTokenAccount,
            tokenProgram: splToken.programId,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc();

        console.info(`seedMetapoolTxn: ${seedMetapoolTxn}`);
        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances("seeding metapool", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);
      });

      it("Propeller SwapExactInput (non propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printPoolUserBalances("poolUserBalancesBefore", poolUserBalancesBefore);
        const exactInputAmount = new BN(100_000);
        const minimumOutputAmount = new BN(0);
        const propellerEnabled = false;
        // const swapExactInputParams = {
        //   exactInputAmounts,
        //   outputTokenIndex,
        //   minimumOutputAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [exactInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);

        const swapExactInputTxn = propellerProgram.methods
          .swapExactInput(
            exactInputAmount,
            minimumOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            tokenProgram: splToken.programId,
            memo: MEMO_PROGRAM_ID,
            twoPoolProgram: twoPoolProgram.programId,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

        const swapExactInputTxnPubkeys = await swapExactInputTxn.pubkeys();
        console.info(
          `swapExactInputTxPubkeys: ${JSON.stringify(
            swapExactInputTxnPubkeys,
            null,
            2,
          )}`,
        );

        const swapExactInputTxnSig = await swapExactInputTxn.rpc(
          rpcCommitmentConfig,
        );
        console.info(`swapExactInputTxnSig: ${swapExactInputTxnSig}`);
        await checkTxnLogsForMemo(swapExactInputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        console.info(`swapExactInput (non propeller-enabled) balances`);
        printBeforeAndAfterPoolUserBalances(
          "swapExactInput (non propeller-enabled) balances",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
        ).toEqual(true);

        expect(
          governanceFeeBalanceAfter.gt(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(
          userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          userToken1AtaBalanceAfter.eq(
            userToken1AtaBalanceBefore.sub(exactInputAmount),
          ),
        ).toEqual(true);
        expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      });

      it("Propeller SwapExactInput (propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        const exactInputAmount = new BN(1_000_000_000);
        const minimumOutputAmount = new BN(0);
        const propellerEnabled = true;
        // const swapExactInputParams = {
        //   exactInputAmounts,
        //   outputTokenIndex,
        //   minimumOutputAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [exactInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);

        const swapExactInputTxn = propellerProgram.methods
          // .swapExactInput(swapExactInputParams)
          .swapExactInput(
            exactInputAmount,
            minimumOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            tokenProgram: splToken.programId,
            memo: MEMO_PROGRAM_ID,
            twoPoolProgram: twoPoolProgram.programId,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

        const swapExactInputTxnPubkeys = await swapExactInputTxn.pubkeys();
        console.info(
          `swapExactInputTxPubkeys: ${JSON.stringify(
            swapExactInputTxnPubkeys,
            null,
            2,
          )}`,
        );

        const swapExactInputTxnSig = await swapExactInputTxn.rpc(
          rpcCommitmentConfig,
        );
        console.info(`swapExactInputTxnSig: ${swapExactInputTxnSig}`);
        await checkTxnLogsForMemo(swapExactInputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        console.info(`swapExactInput (non propeller-enabled) balances`);
        printBeforeAndAfterPoolUserBalances(
          "swapExactInput (non propeller-enabled) balances",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
        ).toEqual(true);

        expect(
          governanceFeeBalanceAfter.gt(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(
          userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          userToken1AtaBalanceAfter.eq(
            userToken1AtaBalanceBefore.sub(exactInputAmount),
          ),
        ).toEqual(true);
        expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      });

      it("Propeller swapExactInput fails when propeller enabled & output amount is insufficient for target chain", async () => {
        const exactInputAmount = new BN(100);
        const minimumOutputAmount = new BN(0);
        const propellerEnabled = true;
        // const swapExactInputParams = {
        //   exactInputAmounts,
        //   outputTokenIndex,
        //   minimumOutputAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [exactInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);

        await expect(() => {
          return (
            propellerProgram.methods
              // .swapExactInput(swapExactInputParams)
              .swapExactInput(
                exactInputAmount,
                minimumOutputAmount,
                memo,
                propellerEnabled,
                CHAIN_ID_ETH,
              )
              .accounts({
                poolTokenAccount0: metapoolPoolToken0Ata,
                poolTokenAccount1: metapoolPoolToken1Ata,
                lpMint: metapoolLpMintKeypair.publicKey,
                governanceFee: metapoolGovernanceFeeAta,
                userTransferAuthority: userTransferAuthority.publicKey,
                userTokenAccount0: userMetapoolTokenAccount0,
                userTokenAccount1: userMetapoolTokenAccount1,
                tokenProgram: splToken.programId,
                memo: MEMO_PROGRAM_ID,
                twoPoolProgram: twoPoolProgram.programId,
                tokenBridgeMint,
              })
              .preInstructions([...approveIxs])
              .postInstructions([...revokeIxs])
              .signers([userTransferAuthority])
              .rpc()
          );
        }).rejects.toThrow("Insufficient Amount being transferred");
      });

      it("Propeller RemoveExactBurn (non propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );

        const exactBurnAmount = new BN(100_000);
        // const outputTokenIndex = 0;
        const minimumOutputAmount = new BN(10);
        // const removeExactBurnParams = {
        //   exactBurnAmount,
        //   outputTokenIndex,
        //   minimumOutputAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [exactBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = false;

        const removeExactBurnTxnSig = await propellerProgram.methods
          .removeExactBurn(
            exactBurnAmount,
            // outputTokenIndex,
            minimumOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            userLpTokenAccount: userMetapoolLpTokenAccount,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
            memo: MEMO_PROGRAM_ID,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`removeExactBurnTxnSig: ${removeExactBurnTxnSig}`);
        await checkTxnLogsForMemo(removeExactBurnTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances(
          "RemoveExactBurn non propeller-enabled",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;
        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          poolToken1AtaBalanceAfter.eq(poolToken1AtaBalanceBefore),
        ).toBeTruthy();

        expect(previousDepthAfter.lt(previousDepthBefore)).toBeTruthy();
        expect(
          userToken0AtaBalanceAfter.gt(
            userToken0AtaBalanceBefore.add(minimumOutputAmount),
          ),
        ).toBeTruthy();
        expect(
          userToken1AtaBalanceAfter.eq(userToken1AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          userLpTokenBalanceAfter.eq(
            userLpTokenBalanceBefore.sub(exactBurnAmount),
          ),
        ).toBeTruthy();
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toBeTruthy();
      });

      it("Propeller RemoveExactBurn (propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );

        const exactBurnAmount = new BN(1_000_000_000);
        // const outputTokenIndex = 0;
        const minimumOutputAmount = propellerEthMinTransferAmount;
        // const removeExactBurnParams = {
        //   exactBurnAmount,
        //   outputTokenIndex,
        //   minimumOutputAmount,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [exactBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;

        const removeExactBurnPropellerEnabledTxnSig =
          await propellerProgram.methods
            .removeExactBurn(
              exactBurnAmount,
              // outputTokenIndex,
              minimumOutputAmount,
              memo,
              propellerEnabled,
              CHAIN_ID_ETH,
            )
            .accounts({
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              userLpTokenAccount: userMetapoolLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              memo: MEMO_PROGRAM_ID,
              tokenBridgeMint,
            })
            .preInstructions([...approveIxs])
            .postInstructions([...revokeIxs])
            .signers([userTransferAuthority])
            .rpc(rpcCommitmentConfig);

        console.info(
          `removeExactBurnPropellerEnabledTxnSig: ${removeExactBurnPropellerEnabledTxnSig}`,
        );
        await checkTxnLogsForMemo(
          removeExactBurnPropellerEnabledTxnSig,
          memoStr,
        );

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances(
          "RemoveExactBurn non propeller-enabled",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;
        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          poolToken1AtaBalanceAfter.eq(poolToken1AtaBalanceBefore),
        ).toBeTruthy();

        expect(previousDepthAfter.lt(previousDepthBefore)).toBeTruthy();
        expect(
          userToken0AtaBalanceAfter.gt(
            userToken0AtaBalanceBefore.add(minimumOutputAmount),
          ),
        ).toBeTruthy();
        expect(
          userToken1AtaBalanceAfter.eq(userToken1AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          userLpTokenBalanceAfter.eq(
            userLpTokenBalanceBefore.sub(exactBurnAmount),
          ),
        ).toBeTruthy();
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toBeTruthy();
      });

      it("Propeller RemoveExactBurn (propeller-enabled) fails when propeller enabled & output amount is insufficient for target chain", async () => {
        const exactBurnAmount = new BN(1_000);
        const minimumOutputAmount = new BN(0);

        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [exactBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;
        await expect(() => {
          return propellerProgram.methods
            .removeExactBurn(
              exactBurnAmount,
              // outputTokenIndex,
              minimumOutputAmount,
              memo,
              propellerEnabled,
              CHAIN_ID_ETH,
            )
            .accounts({
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              userLpTokenAccount: userMetapoolLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              memo: MEMO_PROGRAM_ID,
              tokenBridgeMint,
            })
            .preInstructions([...approveIxs])
            .postInstructions([...revokeIxs])
            .signers([userTransferAuthority])
            .rpc(rpcCommitmentConfig);
        }).rejects.toThrow("Insufficient Amount being transferred");
      });

      it("Propeller SwapExactOutput (non propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );

        const maximumInputAmount = new BN(100_000_000);
        const exactOutputAmount = new BN(50_000);
        // const swapExactOutputParams = {
        //   maximumInputAmount,
        //   inputTokenIndex,
        //   exactOutputAmounts,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [maximumInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = false;

        const swapExactOutputTxnSig = await propellerProgram.methods
          .swapExactOutput(
            maximumInputAmount,
            // inputTokenIndex,
            exactOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
            memo: MEMO_PROGRAM_ID,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`swapExactOutputTxnSig: ${swapExactOutputTxnSig}`);
        await checkTxnLogsForMemo(swapExactOutputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances("swapExactOuput balances", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
        ).toEqual(true);

        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(
          userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          userToken1AtaBalanceAfter.gte(
            userToken1AtaBalanceBefore.sub(maximumInputAmount),
          ),
        ).toEqual(true);
        expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      });

      it("Propeller SwapExactOutput (propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        // const inputTokenIndex = 0;
        const maximumInputAmount = new BN(10_000_000_000);
        const exactOutputAmount = propellerEthMinTransferAmount;
        // const swapExactOutputParams = {
        //   maximumInputAmount,
        //   inputTokenIndex,
        //   exactOutputAmounts,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [maximumInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;

        const swapExactOutputTxnSig = await propellerProgram.methods
          .swapExactOutput(
            maximumInputAmount,
            // inputTokenIndex,
            exactOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
            memo: MEMO_PROGRAM_ID,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`swapExactOutputTxnSig: ${swapExactOutputTxnSig}`);
        await checkTxnLogsForMemo(swapExactOutputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances("swapExactOuput balances", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
        ).toEqual(true);

        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(
          userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          userToken1AtaBalanceAfter.gte(
            userToken1AtaBalanceBefore.sub(maximumInputAmount),
          ),
        ).toEqual(true);
        expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      });

      it("Propeller SwapExactOutput (propeller-enabled) fails when propeller enabled & output amount is insufficient for target chain", async () => {
        // const inputTokenIndex = 0;
        const maximumInputAmount = new BN(100);
        // const maximumInputAmounts = [maximumInputAmount, new BN(0)];
        // maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
        // const exactOutputAmounts = [new BN(0), new BN(50_000)];
        const exactOutputAmount = new BN(1);
        // const swapExactOutputParams = {
        //   maximumInputAmount,
        //   inputTokenIndex,
        //   exactOutputAmounts,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount1],
          [maximumInputAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;
        await expect(() => {
          return propellerProgram.methods
            .swapExactOutput(
              maximumInputAmount,
              // inputTokenIndex,
              exactOutputAmount,
              memo,
              propellerEnabled,
              CHAIN_ID_ETH,
            )
            .accounts({
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              memo: MEMO_PROGRAM_ID,
              tokenBridgeMint,
            })
            .preInstructions([...approveIxs])
            .postInstructions([...revokeIxs])
            .signers([userTransferAuthority])
            .rpc(rpcCommitmentConfig);
        }).rejects.toThrow("Insufficient Amount being transferred");
      });

      it("Propeller RemoveExactOutput (non propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        const metapoolLpMintData = await splToken.account.mint.fetch(
          metapoolLpMintKeypair.publicKey,
        );
        console.info(
          `metapoolLpMintData: ${JSON.stringify({
            ...metapoolLpMintData,
            supply: metapoolLpMintData.supply.toString(),
          })}`,
        );
        printPoolUserBalances(
          "RemoveExactOutput (non propeller-enabled)",
          poolUserBalancesBefore,
        );
        /*
        metapoolLpMintData: {"supply":"178066751666224","decimals":8}

        RemoveExactOutput (non propeller-enabled)
        poolToken0AtaBalance: 1_999_758_297_370, //6 decimals
        poolToken1AtaBalance: 1_001_045_997_289, // 8 decimals
        governanceFeeBalance:1839221,
        userToken0AtaBalance: 98000241702630,
        userToken1AtaBalance: 98998954002711,
        userLpTokenBalance: 178_066_749_827_003,
        lpTokenSupply: 178_066_751_666_224, //8 decimals
        previousDepth: 178066757183876,


         */
        //80_248_436_472 => 802 (8 decimals)
        //30_000_000_000
        //100_035_018_935 => ~1000
        const maximumBurnAmount = new BN(300_000_000_000);

        //TODO: investigate this:
        //    if the output amounts were within 20_000 of each other then no goverance fee
        //    would be minted. is this due to approximation/values used?
        //    with decimals of 6 this is < 1 USDC. is the governance fee just too small in those cases?
        // 1000 or 10?
        const exactOutputAmount = new BN(1_000_000_000);
        // const removeExactOutputParams = {
        //   maximumBurnAmount,
        //   exactOutputAmounts,
        // };
        // const swapExactOutputParams = {
        //   maximumInputAmount,
        //   inputTokenIndex,
        //   exactOutputAmounts,
        // };
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [maximumBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = false;

        const removeExactOutputTxnSig = await propellerProgram.methods
          .removeExactOutput(
            maximumBurnAmount,
            exactOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            userLpTokenAccount: userMetapoolLpTokenAccount,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
            memo: MEMO_PROGRAM_ID,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`removeExactOutputTxnSig: ${removeExactOutputTxnSig}`);
        await checkTxnLogsForMemo(removeExactOutputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances("removeExactOutput balances", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;
        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          poolToken1AtaBalanceAfter.eq(poolToken1AtaBalanceBefore),
        ).toBeTruthy();

        expect(previousDepthAfter.lt(previousDepthBefore)).toBeTruthy();
        expect(
          userToken0AtaBalanceAfter.eq(
            userToken0AtaBalanceBefore.add(exactOutputAmount),
          ),
        ).toBeTruthy();
        expect(
          userToken1AtaBalanceAfter.eq(userToken1AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          userLpTokenBalanceAfter.gte(
            userLpTokenBalanceBefore.sub(maximumBurnAmount),
          ),
        ).toBeTruthy();
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toBeTruthy();
      });

      it("Propeller RemoveExactOutput (propeller-enabled)", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );

        //100_000_000
        //1_002_019_057
        const maximumBurnAmount = new BN(5_000_000_000_000);
        const exactOutputAmount = propellerEthMinTransferAmount;

        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [maximumBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;

        const removeExactOutputTxnSig = await propellerProgram.methods
          .removeExactOutput(
            maximumBurnAmount,
            exactOutputAmount,
            memo,
            propellerEnabled,
            CHAIN_ID_ETH,
          )
          .accounts({
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            userLpTokenAccount: userMetapoolLpTokenAccount,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
            memo: MEMO_PROGRAM_ID,
            tokenBridgeMint,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`removeExactOutputTxnSig: ${removeExactOutputTxnSig}`);
        await checkTxnLogsForMemo(removeExactOutputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolToken0Ata,
          metapoolPoolToken1Ata,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances("swapExactOuput balances", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;
        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          poolToken1AtaBalanceAfter.eq(poolToken1AtaBalanceBefore),
        ).toBeTruthy();

        expect(previousDepthAfter.lt(previousDepthBefore)).toBeTruthy();
        expect(
          userToken0AtaBalanceAfter.eq(
            userToken0AtaBalanceBefore.add(exactOutputAmount),
          ),
        ).toBeTruthy();
        expect(
          userToken1AtaBalanceAfter.eq(userToken1AtaBalanceBefore),
        ).toBeTruthy();
        expect(
          userLpTokenBalanceAfter.gte(
            userLpTokenBalanceBefore.sub(maximumBurnAmount),
          ),
        ).toBeTruthy();
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toBeTruthy();
      });

      it("Propeller RemoveExactOutput (propeller-enabled)  fails when propeller enabled & output amount is insufficient for target chain", async () => {
        const maximumBurnAmount = new BN(100_000_000);
        const exactOutputAmount = new BN(0);

        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolLpTokenAccount],
          [maximumBurnAmount],
          userTransferAuthority.publicKey,
          payer,
        );

        const memoStr = incMemoIdAndGet();
        const memo = Buffer.from(memoStr);
        const propellerEnabled = true;
        await expect(() => {
          return propellerProgram.methods
            .removeExactOutput(
              maximumBurnAmount,
              exactOutputAmount,
              memo,
              propellerEnabled,
              CHAIN_ID_ETH,
            )
            .accounts({
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              userLpTokenAccount: userMetapoolLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              memo: MEMO_PROGRAM_ID,
              tokenBridgeMint,
            })
            .preInstructions([...approveIxs])
            .postInstructions([...revokeIxs])
            .signers([userTransferAuthority])
            .rpc(rpcCommitmentConfig);
        }).rejects.toThrow("Insufficient Amount being transferred");
      });
    });

    it("Propeller RemoveUniform", async () => {
      const poolUserBalancesBefore = await getPoolUserBalances(
        splToken,
        twoPoolProgram,
        poolUsdcAtaAddr,
        poolUsdtAtaAddr,
        flagshipPoolGovernanceFeeAcct,
        userUsdcAtaAddr,
        userUsdtAtaAddr,
        userSwimUsdAtaAddr,
        flagshipPool,
        swimUsdKeypair.publicKey,
      );

      const exactBurnAmount = new BN(100_000);
      const minimumOutputAmounts = [new BN(10_000), new BN(10_000)];
      // const removeUniformParams = {
      //   exactBurnAmount,
      //   minimumOutputAmounts,
      // };
      const userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer,
      );

      const memoStr = incMemoIdAndGet();
      const memo = Buffer.from(memoStr);

      const removeUniformTxnSig = await propellerProgram.methods
        .removeUniform(exactBurnAmount, minimumOutputAmounts, memo)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: flagshipPoolGovernanceFeeAcct,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc(rpcCommitmentConfig);

      console.info(`removeUniformTxnSig: ${removeUniformTxnSig}`);
      await checkTxnLogsForMemo(removeUniformTxnSig, memoStr);

      const poolUserBalancesAfter = await getPoolUserBalances(
        splToken,
        twoPoolProgram,
        poolUsdcAtaAddr,
        poolUsdtAtaAddr,
        flagshipPoolGovernanceFeeAcct,
        userUsdcAtaAddr,
        userUsdtAtaAddr,
        userSwimUsdAtaAddr,
        flagshipPool,
        swimUsdKeypair.publicKey,
      );
      printBeforeAndAfterPoolUserBalances("removeUniform balances", [
        poolUserBalancesBefore,
        poolUserBalancesAfter,
      ]);

      const {
        poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
        governanceFeeBalance: governanceFeeBalanceBefore,
        userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
        userLpTokenBalance: userLpTokenBalanceBefore,
        previousDepth: previousDepthBefore,
      } = poolUserBalancesBefore;

      const {
        poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
        governanceFeeBalance: governanceFeeBalanceAfter,
        userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
        userLpTokenBalance: userLpTokenBalanceAfter,
        previousDepth: previousDepthAfter,
      } = poolUserBalancesAfter;

      expect(poolUsdcAtaBalanceAfter.lt(poolUsdcAtaBalanceBefore)).toEqual(
        true,
      );
      expect(poolUsdtAtaBalanceAfter.lt(poolUsdtAtaBalanceBefore)).toEqual(
        true,
      );
      expect(
        userUsdcAtaBalanceAfter.gte(
          userUsdcAtaBalanceBefore.add(minimumOutputAmounts[0]),
        ),
      ).toEqual(true);
      expect(
        userUsdtAtaBalanceAfter.gte(
          userUsdtAtaBalanceBefore.add(minimumOutputAmounts[1]),
        ),
      ).toEqual(true);
      expect(
        userLpTokenBalanceAfter.eq(
          userLpTokenBalanceBefore.sub(exactBurnAmount),
        ),
      ).toEqual(true);
      expect(governanceFeeBalanceAfter.eq(governanceFeeBalanceBefore)).toEqual(
        true,
      );
      expect(!previousDepthAfter.eq(previousDepthBefore)).toEqual(true);
    });
  });

  describe("propeller wormhole ixs", () => {
    it("Does token bridge transfer", async () => {
      const userLpTokenBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;

      try {
        await splToken.account.token.fetch(custody);
        expect(false).toBeTruthy();
      } catch (e) {
        console.info(
          `expected err from fetching custody account: ${JSON.stringify(e)}`,
        );
      }
      const custodyAmountBefore = new BN(0);
      const transferAmount = new BN(100_000_000);
      const nonce = createNonce().readUInt32LE(0);
      const memo = "e45794d6c5a2750a";
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write(memo);
      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const propellerEnabled = true;
      const transferNativeTxn = await propellerProgram.methods
        .transferNativeWithPayload(
          nonce,
          CHAIN_ID_ETH,
          transferAmount,
          evmTargetTokenId,
          // evmTargetTokenAddr,
          evmOwner,
          gasKickstart,
          propellerEnabled,
          memoBuffer,
        )
        .accounts({
          propeller,
          payer: payer.publicKey,
          tokenBridgeConfig,
          userTokenBridgeAccount: userSwimUsdAtaAddr,
          tokenBridgeMint,
          custody,
          tokenBridge,
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
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`);
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const userLpTokenBalanceAfter2 = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.info(
        `userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`,
      );
      expect(
        userLpTokenBalanceAfter2.eq(
          userLpTokenBalanceBefore.sub(transferAmount),
        ),
      ).toEqual(true);

      const custodyAmountAfter = (await splToken.account.token.fetch(custody))
        .amount;
      console.info(`custodyAmountAfter: ${custodyAmountAfter.toString()}`);
      expect(
        custodyAmountAfter.eq(custodyAmountBefore.add(transferAmount)),
      ).toEqual(true);

      const messageAccountInfo = await connection.getAccountInfo(
        wormholeMessage.publicKey,
      );
      if (!messageAccountInfo) {
        throw new Error("No Message Account Info found");
      }
      console.info(
        `messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`,
      );

      const parsedTokenTransferWithSwimPayloadPostedMessage =
        await parseTokenTransferWithSwimPayloadPostedMessage(
          messageAccountInfo.data,
        );
      console.info(`
      parsedTokenTransferWithSwimPayloadPostedMessage:
        ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadPostedMessage(
            parsedTokenTransferWithSwimPayloadPostedMessage,
          ),
          null,
          2,
        )}
      `);

      const { tokenTransferMessage } =
        parsedTokenTransferWithSwimPayloadPostedMessage;

      const tokenTransferTo = tokenTransferMessage.tokenTransfer.to;
      expect(uint8ArrayToHex(tokenTransferTo)).toEqual(
        ethRoutingContractEthHexStr,
      );
      const formattedTokenTransferMessage =
        formatParsedTokenTransferPostedMessage(tokenTransferMessage);
      console.info(
        `formattedTokenTransferMessage: ${JSON.stringify(
          formattedTokenTransferMessage,
          null,
          2,
        )}`,
      );
      // this fails due to capitalization
      // expect(formattedTokenTransferMessage.tokenTransfer.to).to.equal(ethRoutingContractStr);
      // console.info(`
      //   tokenTransferMessage: ${JSON.stringify(tokenTransferMessage, null ,2)}
      // `)
      // console.info(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.info(`postedMessagePayload:\n${JSON.stringify(postedMessagePayload)}`);
      // const {
      //   payload: swimPayload
      // } = postedMessagePayload;
      // console.info(`
      //   evmOwnerEthHexStr: ${evmOwnerEthHexStr}
      //   evmOwner(Buffer.toString('hex')): ${evmOwner.toString('hex')}
      //   evmTargetTokenAddrEthHexStr: ${evmTargetTokenAddrEthHexStr}
      //   evmTargetTokenAddr(Buffer.toString('hex')): ${evmTargetTokenAddr.toString('hex')}
      // `);
      // console.info(`swimPayload:\n${JSON.stringify(swimPayload)}`);
      // const transferAmountBuffer = transferAmount.toBuffer('be');
      // console.info(`transferAmountBufferHexStr: ${transferAmountBuffer.toString('hex')}`);
    });

    it("Fails token bridge transfer if transferAmount < minTransferAmount for targetChain", async () => {
      const transferAmount = propellerEthMinTransferAmount.div(new BN(2));
      const nonce = createNonce().readUInt32LE(0);
      const memo = "e45794d6c5a2751a";
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write(memo);
      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const propellerEnabled = true;
      await expect(() => {
        return propellerProgram.methods
          .transferNativeWithPayload(
            nonce,
            CHAIN_ID_ETH,
            transferAmount,
            evmTargetTokenId,
            // evmTargetTokenAddr,
            evmOwner,
            gasKickstart,
            propellerEnabled,
            memoBuffer,
          )
          .accounts({
            propeller,
            payer: payer.publicKey,
            tokenBridgeConfig,
            userTokenBridgeAccount: userSwimUsdAtaAddr,
            tokenBridgeMint,
            custody,
            tokenBridge,
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
          .signers([wormholeMessage])
          .preInstructions([requestUnitsIx])
          .rpc();
      }).rejects.toThrow("Insufficient Amount being transferred");
    });

    describe("User submitted CompleteWithPayload and ProcessSwimPayload", () => {
      const propellerEnabled = false;
      const gasKickstart = false;

      describe("for token from flagship pool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;

        const targetTokenId = usdcOutputTokenIndex;
        const memoStr = incMemoIdAndGet();

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            owner: provider.publicKey.toBuffer(),
            memo: memoBuffer,
            propellerEnabled,
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const propellerCompleteNativeWithPayload = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerRedeemerEscrowAccount,
              // tokenBridgeMint,
              custody: custody,
              mint: tokenBridgeMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              memo: MEMO_PROGRAM_ID,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([requestUnitsIx]);

          const propellerCompleteNativeWithPayloadPubkeys =
            await propellerCompleteNativeWithPayload.pubkeys();

          if (!propellerCompleteNativeWithPayloadPubkeys.propellerMessage) {
            throw new Error("propellerMessage key not derived");
          }
          console.info(
            `propellerCompleteNativeWithPayloadPubkeys: ${JSON.stringify(
              propellerCompleteNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedPropellerMessage, expectedPropellerMessageBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                wormholeClaim.toBuffer(),
                wormholeMessage.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(expectedPropellerMessage.toBase58()).toEqual(
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage.toBase58(),
          );

          propellerMessage =
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage;

          const propellerCompleteNativeWithPayloadTxn =
            await propellerCompleteNativeWithPayload.transaction();
          const transferNativeTxnSig = await provider.sendAndConfirm(
            propellerCompleteNativeWithPayloadTxn,
            [payer],
            {
              skipPreflight: true,
            },
          );

          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerCompleteNativeWithPayloadPubkeys.propellerMessage,
            );
          console.info(
            `propellerMessageAccount: ${JSON.stringify(
              propellerMessageAccount,
              null,
              2,
            )}`,
          );
          expect(propellerMessageAccount.bump).toEqual(
            expectedPropellerMessageBump,
          );
          expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(propellerMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          expect(
            propellerMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();
          expect(
            propellerMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();
          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = propellerMessageAccount.swimPayload;
          expect(propellerMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          const propellerMessageOwnerPubKey = new PublicKey(
            propellerMessageAccount.owner,
          );
          expect(propellerMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(propellerMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);

          const transferNativeTxnSize =
            propellerCompleteNativeWithPayloadTxn.serialize().length;
          console.info(
            `transferNativeTxnSize txnSize: ${transferNativeTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: transferNativeTxnSig,
            ...(await connection.getLatestBlockhash()),
          });

          const propellerRedeemerEscrowAccountAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`
            propellerRedeemerEscrowAccount
              Before: ${propellerRedeemerEscrowAccountBefore.toString()}
              After: ${propellerRedeemerEscrowAccountAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowAccountAfter.gt(
              propellerRedeemerEscrowAccountBefore,
            ),
          ).toEqual(true);
          await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);
        });

        it("processes swim payload", async () => {
          const pool = flagshipPool;
          const poolTokenAccount0 = poolUsdcAtaAddr;
          const poolTokenAccount1 = poolUsdtAtaAddr;
          const lpMint = tokenBridgeMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            userTokenAccount0BalanceAfter.gt(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });

        //TODO: add min_output_amount test cases
      });

      describe("for swimUSD as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;

        const targetTokenId = swimUsdOutputTokenIndex;

        const memoStr = incMemoIdAndGet();
        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
            // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
            owner: provider.publicKey.toBuffer(),
            // minOutputAmount: 0n,
            memo: memoBuffer,
            propellerEnabled,
            // minThreshold: BigInt(0),
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const propellerCompleteNativeWithPayload = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerRedeemerEscrowAccount,
              // tokenBridgeMint,
              custody: custody,
              mint: tokenBridgeMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              memo: MEMO_PROGRAM_ID,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([requestUnitsIx]);

          const propellerCompleteNativeWithPayloadPubkeys =
            await propellerCompleteNativeWithPayload.pubkeys();

          if (!propellerCompleteNativeWithPayloadPubkeys.propellerMessage) {
            throw new Error("propellerMessage key not derived");
          }
          console.info(
            `propellerCompleteNativeWithPayloadPubkeys: ${JSON.stringify(
              propellerCompleteNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedPropellerMessage, expectedPropellerMessageBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                wormholeClaim.toBuffer(),
                wormholeMessage.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(expectedPropellerMessage.toBase58()).toEqual(
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage.toBase58(),
          );

          propellerMessage =
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage;

          const propellerCompleteNativeWithPayloadTxn =
            await propellerCompleteNativeWithPayload.transaction();
          const transferNativeTxnSig = await provider.sendAndConfirm(
            propellerCompleteNativeWithPayloadTxn,
            [payer],
            {
              skipPreflight: true,
            },
          );

          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerCompleteNativeWithPayloadPubkeys.propellerMessage,
            );
          console.info(
            `propellerMessageAccount: ${JSON.stringify(
              propellerMessageAccount,
              null,
              2,
            )}`,
          );
          expect(propellerMessageAccount.bump).toEqual(
            expectedPropellerMessageBump,
          );
          expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(propellerMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          expect(
            propellerMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();
          expect(
            propellerMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();
          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = propellerMessageAccount.swimPayload;
          expect(propellerMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          const propellerMessageOwnerPubKey = new PublicKey(
            propellerMessageAccount.owner,
          );
          expect(propellerMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(propellerMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);

          const transferNativeTxnSize =
            propellerCompleteNativeWithPayloadTxn.serialize().length;
          console.info(
            `transferNativeTxnSize txnSize: ${transferNativeTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: transferNativeTxnSig,
            ...(await connection.getLatestBlockhash()),
          });

          const propellerRedeemerEscrowAccountAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`
            propellerRedeemerEscrowAccount
              Before: ${propellerRedeemerEscrowAccountBefore.toString()}
              After: ${propellerRedeemerEscrowAccountAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowAccountAfter.gt(
              propellerRedeemerEscrowAccountBefore,
            ),
          ).toEqual(true);
          await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);
        });

        it("processes swim payload", async () => {
          const pool = flagshipPool;
          const poolTokenAccount0 = poolUsdcAtaAddr;
          const poolTokenAccount1 = poolUsdtAtaAddr;
          const lpMint = tokenBridgeMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }

          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceAfter = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          expect(
            userLpTokenAccountBalanceAfter.eq(
              userLpTokenAccountBalanceBefore.add(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });

      describe("for token from metapool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;
        const targetTokenId = metapoolMint1OutputTokenIndex;
        const memoStr = incMemoIdAndGet();
        // const memo = "e45794d6c5a2750b";

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
            // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
            owner: provider.publicKey.toBuffer(),
            // minOutputAmount: 0n,
            memo: memoBuffer,
            propellerEnabled,
            // minThreshold: BigInt(0),
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const propellerCompleteNativeWithPayload = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerRedeemerEscrowAccount,
              // tokenBridgeMint,
              custody: custody,
              mint: tokenBridgeMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              memo: MEMO_PROGRAM_ID,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([requestUnitsIx]);

          const propellerCompleteNativeWithPayloadPubkeys =
            await propellerCompleteNativeWithPayload.pubkeys();

          if (!propellerCompleteNativeWithPayloadPubkeys.propellerMessage) {
            throw new Error("propellerMessage key not derived");
          }
          console.info(
            `propellerCompleteNativeWithPayloadPubkeys: ${JSON.stringify(
              propellerCompleteNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedPropellerMessage, expectedPropellerMessageBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                wormholeClaim.toBuffer(),
                wormholeMessage.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(expectedPropellerMessage.toBase58()).toEqual(
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage.toBase58(),
          );

          propellerMessage =
            propellerCompleteNativeWithPayloadPubkeys.propellerMessage;

          const propellerCompleteNativeWithPayloadTxn =
            await propellerCompleteNativeWithPayload.transaction();
          const transferNativeTxnSig = await provider.sendAndConfirm(
            propellerCompleteNativeWithPayloadTxn,
            [payer],
            {
              skipPreflight: true,
            },
          );

          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerCompleteNativeWithPayloadPubkeys.propellerMessage,
            );
          console.info(
            `propellerMessageAccount: ${JSON.stringify(
              propellerMessageAccount,
              null,
              2,
            )}`,
          );
          expect(propellerMessageAccount.bump).toEqual(
            expectedPropellerMessageBump,
          );
          expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(propellerMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          expect(
            propellerMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();
          expect(
            propellerMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();
          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = propellerMessageAccount.swimPayload;
          expect(propellerMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          const propellerMessageOwnerPubKey = new PublicKey(
            propellerMessageAccount.owner,
          );
          expect(propellerMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(propellerMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);

          const transferNativeTxnSize =
            propellerCompleteNativeWithPayloadTxn.serialize().length;
          console.info(
            `transferNativeTxnSize txnSize: ${transferNativeTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: transferNativeTxnSig,
            ...(await connection.getLatestBlockhash()),
          });

          const propellerRedeemerEscrowAccountAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`
            propellerRedeemerEscrowAccount
              Before: ${propellerRedeemerEscrowAccountBefore.toString()}
              After: ${propellerRedeemerEscrowAccountAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowAccountAfter.gt(
              propellerRedeemerEscrowAccountBefore,
            ),
          ).toEqual(true);
          await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);
        });

        it("processes swim payload", async () => {
          const pool = metapool;
          const poolTokenAccount0 = metapoolPoolToken0Ata;
          const poolTokenAccount1 = metapoolPoolToken1Ata;
          const lpMint = metapoolLpMint;
          const governanceFeeAcct = metapoolGovernanceFeeAta;
          // user's swimUSdTokenAccount. should be unchanged.
          const userTokenAccount0 = userMetapoolTokenAccount0;
          // user's output_token_index token account. should be increased.
          const userTokenAccount1 = userMetapoolTokenAccount1;
          // user's lp token account. should be unchanged.
          const userLpTokenAccount = userMetapoolLpTokenAccount;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceAfter = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          const outputAmount = userTokenAccount1BalanceAfter.sub(
            userTokenAccount1BalanceBefore,
          );
          expect(
            userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.gt(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          expect(
            userLpTokenAccountBalanceAfter.eq(userLpTokenAccountBalanceBefore),
          ).toBeTruthy();
          console.info(`outputAmount: ${outputAmount.toString()}`);
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });
    });
  });

  async function checkTxnLogsForMemo(txSig: string, memoStr: string) {
    console.info(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txnInfo) {
      throw new Error("txnInfo is null");
    }
    if (!txnInfo.meta) {
      throw new Error("txnInfo.meta is null");
    }
    if (!txnInfo.meta.logMessages) {
      throw new Error("txnInfo undefined");
    }
    const txnLogs = txnInfo.meta.logMessages;
    const memoLogFound = txnLogs.some(
      (log) => log.startsWith("Program log: Memo") && log.includes(memoStr),
    );
    expect(memoLogFound).toEqual(true);
  }

  function incMemoIdAndGet() {
    return (++memoId).toString().padStart(16, "0");
  }
});
