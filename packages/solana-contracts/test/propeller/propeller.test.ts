import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryHexToNativeAssetString,
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
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { getApproveAndRevokeIxs } from "../../src";
import type { Propeller } from "../../src/artifacts/propeller";
import type { TwoPool } from "../../src/artifacts/two_pool";
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
  formatParsedTokenTransferWithSwimPayloadVaa,
  getPropellerPda,
  getPropellerRedeemerPda,
  getPropellerSenderPda,
  parseTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadSignedVaa,
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
// import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
const MEMO_PROGRAM_ID: PublicKey = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

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

let ethTokenBridgeSequence = BigInt(0);

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
let governanceFeeAddr: web3.PublicKey;

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

const metapoolMintKeypair0 = swimUsdKeypair;
const metapoolMintKeypair1 = web3.Keypair.generate();
const metapoolMintAuthority1 = payer;
const metapoolMintDecimal1 = 8;
const metapoolMintKeypairs = [metapoolMintKeypair0, metapoolMintKeypair1];
const metapoolMintDecimals = [mintDecimal, metapoolMintDecimal1];
// const metapoolMintAuthorities = [flagshipPool, metapoolMintAuthority1];

const metapoolLpMintKeypair = web3.Keypair.generate();
let metapoolPoolTokenAta0: web3.PublicKey;
let metapoolPoolTokenAta1: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
const propellerMinTransferAmount = new BN(5_000_000);
const propellerEthMinTransferAmount = new BN(10_000_000);
let marginalPricePool: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

// const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
const usdtOutputTokenIndex = 2;
// const metapoolMint1OutputTokenIndex = 3;
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

// let switchboard: SwitchboardTestContext;
// let aggregatorKey: PublicKey;

describe("propeller", () => {
  beforeAll(async () => {
    console.info(`initializing two pool v2`);
    ({
      poolPubkey: flagshipPool,
      poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
      governanceFeeAccount: governanceFeeAddr,
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
        governanceFeeAccount: governanceFeeAddr,
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
      poolTokenAccounts: [metapoolPoolTokenAta0, metapoolPoolTokenAta1],
      governanceFeeAccount: metapoolGovernanceFeeAta,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      metapoolMintKeypairs,
      metapoolMintDecimals,
      [flagshipPool, metapoolMintAuthority1.publicKey],
      // [metapoolMintKeypair1],
      // [metapoolMintDecimal1],
      // [metapoolMintAuthority1.publicKey],
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
        poolTokenAccount0: metapoolPoolTokenAta0,
        poolTokenAccount1: metapoolPoolTokenAta1,
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
      [metapoolMintKeypair1.publicKey],
      [metapoolMintAuthority1],
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

  it("Initializes propeller PDA", async () => {
    const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
      propellerProgram.programId,
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

    const expectedPropellerAddr = await getPropellerPda(
      tokenBridgeMint,
      propellerProgram.programId,
    );
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
    const usdcTokenIdMap = {
      pool: flagshipPool,
      poolTokenIndex: 0,
      poolTokenMint: usdcKeypair.publicKey,
      poolIx: { removeExactBurn: {} },
    };
    const usdtTokenIdMap = {
      pool: flagshipPool,
      poolTokenIndex: 1,
      poolTokenMint: usdtKeypair.publicKey,
      poolIx: { removeExactBurn: {} },
    };
    // metapoolMint1TokenIdMap = {
    //   pool: metapool,
    //   poolTokenIndex: 1,
    //   poolTokenMint: metapoolMint1Keypair.publicKey,
    //   poolIx: { swapExactInput: {} }
    // };
    // outputTokenIdMappings = new Map([
    //   [usdcOutputTokenIndex, usdcTokenIdMap],
    //   [usdtOutputTokenIndex, usdtTokenIdMap],
    //   // [metapoolMint1OutputTokenIndex, metapoolMint1TokenIdMap],
    // ]);

    const outputTokenIdMapAddrEntries = await Promise.all(
      [
        { outputTokenIndex: usdcOutputTokenIndex, tokenIdMap: usdcTokenIdMap },
        { outputTokenIndex: usdtOutputTokenIndex, tokenIdMap: usdtTokenIdMap },
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
            pool: flagshipPool,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .signers([propellerAdmin]);

        const pubkeys = await createTokenIdMappingTxn.pubkeys();
        const tokenIdMapAddr = pubkeys.tokenIdMap;
        expect(tokenIdMapAddr).toBeTruthy();

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
        return { outputTokenIndex, tokenIdMapAddr };
      }),
    );

    const outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey> = new Map(
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
          governanceFeeAddr,
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
        const memoString = "propeller add";
        const memo = Buffer.from(memoString, "utf-8");
        const addTxn = propellerProgram.methods
          .add(
            inputAmounts,
            minimumMintAmount,
            memo,
            CHAIN_ID_ETH,
            propellerEnabled,
          )
          .accounts({
            propeller: propeller,
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
            governanceFee: governanceFeeAddr,
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
          governanceFeeAddr,
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
        await checkTxnLogsForMemo(addTxnSig, memoString);
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
        const memoString = "propeller add";
        const memo = Buffer.from(memoString, "utf-8");

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
              governanceFee: governanceFeeAddr,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        // const initMetapoolTxn = twoPoolProgram.methods
        //   .initialize(ampFactor, lpFee, governanceFee)
        //   .accounts({
        //     payer: provider.publicKey,
        //     poolMint0: metapoolMintKeypair0.publicKey,
        //     poolMint1: metapoolMintKeypair1.publicKey,
        //     lpMint: metapoolLpMintKeypair.publicKey,
        //     poolTokenAccount0: metapoolPoolTokenAta0,
        //     poolTokenAccount1: metapoolPoolTokenAta1,
        //     pauseKey: pauseKeypair.publicKey,
        //     governanceAccount: governanceKeypair.publicKey,
        //     governanceFeeAccount: metapoolGovernanceFeeAta,
        //     tokenProgram: splToken.programId,
        //     associatedTokenProgram: splAssociatedToken.programId,
        //     systemProgram: web3.SystemProgram.programId,
        //     rent: web3.SYSVAR_RENT_PUBKEY,
        //   })
        //   .signers([metapoolLpMintKeypair]);

        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        printPoolUserBalances("poolUserBalancesBefore", poolUserBalancesBefore);
        // const exactInputAmounts = [new BN(0), new BN(100_000)];
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
        const memoString = "propeller SwapExactInput";
        const memo = Buffer.from(memoString, "utf-8");

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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(swapExactInputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        const memoString = "propeller SwapExactInput";
        const memo = Buffer.from(memoString, "utf-8");

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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(swapExactInputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        // const exactInputAmounts = [new BN(100), new BN(0)];
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
        const memoString = "SwapExactInputF";
        const memo = Buffer.from(memoString, "utf-8");

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
                poolTokenAccount0: metapoolPoolTokenAta0,
                poolTokenAccount1: metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        const memoString = "propeller RemoveExactBurn";
        const memo = Buffer.from(memoString, "utf-8");
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(removeExactBurnTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        const memoString = "propeller RemoveExactBurn";
        const memo = Buffer.from(memoString, "utf-8");
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
              poolTokenAccount0: metapoolPoolTokenAta0,
              poolTokenAccount1: metapoolPoolTokenAta1,
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
          memoString,
        );

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
        const memoString = "propeller RemoveExactBurn";
        const memo = Buffer.from(memoString, "utf-8");
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
              poolTokenAccount0: metapoolPoolTokenAta0,
              poolTokenAccount1: metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );

        // const inputTokenIndex = 0;
        const maximumInputAmount = new BN(100_000_000);
        // const maximumInputAmounts = [maximumInputAmount, new BN(0)];
        // maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
        // const exactOutputAmounts = [new BN(0), new BN(50_000)];
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

        const memoString = "propeller SwapExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(swapExactOutputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        // const inputTokenIndex = 0;
        const maximumInputAmount = new BN(10_000_000_000);
        // const maximumInputAmounts = [maximumInputAmount, new BN(0)];
        // maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
        // const exactOutputAmounts = [new BN(0), new BN(50_000)];
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

        const memoString = "propeller SwapExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(swapExactOutputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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

        const memoString = "propeller SwapExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
              poolTokenAccount0: metapoolPoolTokenAta0,
              poolTokenAccount1: metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
          metapoolGovernanceFeeAta,
          userMetapoolTokenAccount0,
          userMetapoolTokenAccount1,
          userMetapoolLpTokenAccount,
          metapool,
          metapoolLpMintKeypair.publicKey,
        );
        const metapoolLpMint = await splToken.account.mint.fetch(
          metapoolLpMintKeypair.publicKey,
        );
        console.info(
          `metapoolLpMint: ${JSON.stringify({
            ...metapoolLpMint,
            supply: metapoolLpMint.supply.toString(),
          })}`,
        );
        printPoolUserBalances(
          "RemoveExactOutput (non propeller-enabled)",
          poolUserBalancesBefore,
        );
        /*
        metapoolLpMint: {"supply":"178066751666224","decimals":8}

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

        const memoString = "propeller RemoveExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(removeExactOutputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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

        const memoString = "propeller RemoveExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
            poolTokenAccount0: metapoolPoolTokenAta0,
            poolTokenAccount1: metapoolPoolTokenAta1,
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
        await checkTxnLogsForMemo(removeExactOutputTxnSig, memoString);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          metapoolPoolTokenAta0,
          metapoolPoolTokenAta1,
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

        const memoString = "propeller RemoveExactOutput";
        const memo = Buffer.from(memoString, "utf-8");
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
              poolTokenAccount0: metapoolPoolTokenAta0,
              poolTokenAccount1: metapoolPoolTokenAta1,
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
        governanceFeeAddr,
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

      const memoString = "propeller RemoveUniform";
      const memo = Buffer.from(memoString, "utf-8");

      const removeUniformTxnSig = await propellerProgram.methods
        .removeUniform(exactBurnAmount, minimumOutputAmounts, memo)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
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
      await checkTxnLogsForMemo(removeUniformTxnSig, memoString);

      const poolUserBalancesAfter = await getPoolUserBalances(
        splToken,
        twoPoolProgram,
        poolUsdcAtaAddr,
        poolUsdtAtaAddr,
        governanceFeeAddr,
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
    it("fails", () => {
      expect(false).toEqual(true);
    });
  });

  describe("propeller wormhole ixs", () => {
    it("Does token bridge transfer", async () => {
      // const inputAmounts = [new BN(100_000_000_000), new BN(100_000_000_000)];
      //
      // const minimumMintAmount = new BN(0);

      // const custodyAmountBefore: BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
      // const poolAddParams = {
      //   inputAmounts,
      //   minimumMintAmount
      // };

      // const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
      //   units: 900000,
      //   additionalFee: 0,
      // });

      const userLpTokenBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      // console.info(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
      //
      // const propellerPoolAddTxn = await propellerProgram
      //   .methods
      //   .addV2(
      //     poolAddParams
      //   )
      //   .accounts({
      //     // propeller,
      //     poolState: flagshipPool,
      //     poolAuth,
      //     poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
      //     poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
      //     lpMint: flagshipPoolData.lpMintKey,
      //     governanceFee: flagshipPoolData.governanceFeeKey,
      //     userTokenAccount0: userUsdcAtaAddr,
      //     userTokenAccount1: userUsdtAtaAddr,
      //     poolProgram: TWO_POOL_PROGRAM_ID,
      //     tokenProgram: splToken.programId,
      //     userLpTokenAccount: userSwimUsdAtaAddr,
      //     payer: payer.publicKey,
      //   })
      //   // .signers([wormholeMessage])
      //   // .preInstructions([
      //   // 	requestUnitsIx,
      //   // ])
      //   .transaction();
      // const addLiqTxnSig = await provider.sendAndConfirm(
      //   propellerPoolAddTxn,
      //   [payer],
      //   {
      //     skipPreflight: true,
      //   }
      // );
      // const txnSize = propellerPoolAddTxn.serialize().length;
      // console.info(`addAndWormholeTransfer txnSize: ${txnSize}`)
      // await connection.confirmTransaction({
      //   signature: addLiqTxnSig,
      //   ...(await connection.getLatestBlockhash())
      // });
      // const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      // console.info(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
      // const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);

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
      /*
        vaa: 118,97,97
        msg: 109,115,103
        msu: 109,115,117
        let discriminators = ["vaa", "msg", "msu"];
        let txtEncoder = new TextEncoder();
        discriminators.forEach(discriminator => { console.info(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
       */
      // program.methods.Message.deserialize(messageAccountInfo.data);

      // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
      // const {
      // 	payload: postedMessagePayload2,
      // } = parsed2;
      // console.info(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
      // const {
      //   payload: postedMessagePayload,
      //   ...postedMessage
      // }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
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

      /**
       * {"version":0,"targetTokenId":2,"targetToken":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]},"owner":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4]},"minOutputAmount":"0","propellerEnabled":true,"propellerFee":"0","gasKickstart":false,"targetTokenStr":"\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0003","targetTokenHexStr":"0000000000000000000000000000000000000000000000000000000000000003","ownerStr":"\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0004","ownerHexStr":"0000000000000000000000000000000000000000000000000000000000000004"}
       * transferAmountBufferHexStr: 0186a0
       */
    });

    it("Fails token bridge transfer if transferAmount < minTransferAmount for targetChain", async () => {
      // const inputAmounts = [new BN(100_000_000_000), new BN(100_000_000_000)];
      //
      // const minimumMintAmount = new BN(0);

      // const custodyAmountBefore: BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
      // const poolAddParams = {
      //   inputAmounts,
      //   minimumMintAmount
      // };

      // const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
      //   units: 900000,
      //   additionalFee: 0,
      // });

      // const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;

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
      // try {
      //   console.info(`sending expected failed transfer native txn`);
      //
      //   const expectedFailedTransferNativeTxn = await propellerProgram.methods
      //     .transferNativeWithPayload(
      //       nonce,
      //       CHAIN_ID_ETH,
      //       transferAmount,
      //       evmTargetTokenId,
      //       // evmTargetTokenAddr,
      //       evmOwner,
      //       gasKickstart,
      //       propellerEnabled,
      //       memoBuffer,
      //     )
      //     .accounts({
      //       propeller,
      //       payer: payer.publicKey,
      //       tokenBridgeConfig,
      //       userTokenBridgeAccount: userSwimUsdAtaAddr,
      //       tokenBridgeMint,
      //       custody,
      //       tokenBridge,
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
      //       memo: MEMO_PROGRAM_ID,
      //     })
      //     .signers([wormholeMessage])
      //     .preInstructions([requestUnitsIx])
      //     .rpc();
      //   console.info(
      //     `expectedFailedTransferNativeTxn: ${expectedFailedTransferNativeTxn}`,
      //   );
      //   // assert(false, "should not have been able to execute transferNativeWithPayload");
      // } catch (_err) {
      //   console.info(`successfully threw error: ${JSON.stringify(_err)}`);
      //   expect(_err instanceof AnchorError).toEqual(true);
      //   const err: AnchorError = _err;
      //   expect(err.error.errorMessage).toEqual(
      //     "Insufficient Amount being transferred",
      //   );
      // }
    });

    it("mocks token transfer with payload then verifySig & postVaa then complete with payload", async () => {
      const memo = "e45794d6c5a2750b";
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write(memo);
      // const owner = tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA);
      // encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
      const swimPayload = {
        version: 0,
        // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
        // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
        owner: provider.publicKey.toBuffer(),
        //for targetTokenId, how do i know which pool to go to for the token?
        // e.g. 0 probably reserved for swimUSD
        // 1 usdc
        // 2 usdt
        // 3 some other solana stablecoin
        targetTokenId: 0,
        // minOutputAmount: 0n,
        memo: memoBuffer,
        propellerEnabled: true,
        minThreshold: BigInt(0),
        gasKickstart: false,
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
        ++ethTokenBridgeSequence,
        encodeTokenTransferWithPayload(
          amount.toString(),
          swimUsdKeypair.publicKey.toBuffer(),
          CHAIN_ID_SOLANA,
          // propellerRedeemer,
          //"to" - if vaa.to != `Redeemer` account then it is assumed that this transfer was targeting
          // a contract(the programId of the vaa.to field) and token bridge will verify that redeemer is a pda
          //  owned by the `vaa.to` and derived the seed "redeemer".
          // note - technically you can specify an arbitrary PDA account as the `to` field
          // as long as the redeemer account is set to the same address but then we (propeller contract)
          // would need to do the validations ourselves.
          propellerProgram.programId,
          ethRoutingContract,
          encodeSwimPayload(swimPayload),
        ),
      );
      const propellerRedeemerEscrowAccountBefore = (
        await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      ).amount;

      // const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferWithPayloadSignedVaa);
      // console.info(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);

      // const parsedVaa = await parseVaa(tokenTransferWithPayloadSignedVaa);
      // const formattedParsedVaa = formatParsedVaa(parsedVaa);
      // console.info(`
      //   formattedParsedVaa: ${JSON.stringify(formattedParsedVaa, null, 2)}
      // `)
      const parsedTokenTransferWithSwimPayloadVaa =
        parseTokenTransferWithSwimPayloadSignedVaa(
          tokenTransferWithPayloadSignedVaa,
        );
      console.info(`
        parsedTokenTransferWithSwimPayloadVaa: ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadVaa(
            parsedTokenTransferWithSwimPayloadVaa,
          ),
          null,
          2,
        )}
      `);

      // const swimPayload = {
      //   version: 0,
      //   // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
      //   // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
      //   owner: provider.publicKey.toBuffer(),
      //   //for targetTokenId, how do i know which pool to go to for the token?
      //   // e.g. 0 probably reserved for swimUSD
      //   // 1 usdc
      //   // 2 usdt
      //   // 3 some other solana stablecoin
      //   targetTokenId: 0,
      //   // minOutputAmount: 0n,
      //   memo: memoBuffer,
      //   propellerEnabled: true,
      //   minThreshold: BigInt(0),
      //   gasKickstart: false,
      // };
      // const amount = parseUnits("1", mintDecimal);
      // console.info(`amount: ${amount.toString()}`);
      // /**
      //  * this is encoding a token transfer from eth routing contract
      //  * with a swimUSD token address that originated on solana
      //  * the same as initializing a `TransferWrappedWithPayload` from eth
      //  */
      //
      // const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      //   0,
      //   0,
      //   CHAIN_ID_ETH as number,
      //   ethTokenBridge,
      //   ++ethTokenBridgeSequence,
      //   encodeTokenTransferWithPayload(
      //     amount.toString(),
      //     swimUsdKeypair.publicKey.toBuffer(),
      //     CHAIN_ID_SOLANA,
      //     // propellerRedeemer,
      //     //"to" - if vaa.to != `Redeemer` account then it is assumed that this transfer was targeting
      //     // a contract(the programId of the vaa.to field) and token bridge will verify that redeemer is a pda
      //     //  owned by the `vaa.to` and derived the seed "redeemer".
      //     // note - technically you can specify an arbitrary PDA account as the `to` field
      //     // as long as the redeemer account is set to the same address but then we (propeller contract)
      //     // would need to do the validations ourselves.
      //     propellerProgram.programId,
      //     ethRoutingContract,
      //     encodeSwimPayload(swimPayload),
      //   ),
      // );
      const {
        tokenTransferVaa: {
          core: parsedVaa,
          tokenTransfer: parsedTokenTransferFromVaa,
        },
        swimPayload: swimPayloadFromVaa,
      } = parsedTokenTransferWithSwimPayloadVaa;
      expect(parsedVaa.nonce).toEqual(nonce);
      expect(parsedTokenTransferFromVaa.tokenChain).toEqual(CHAIN_ID_SOLANA);
      expect(
        new web3.PublicKey(
          tryHexToNativeAssetString(
            parsedTokenTransferFromVaa.tokenAddress.toString("hex"),
            CHAIN_ID_SOLANA,
          ),
        ),
      ).toEqual(swimUsdKeypair.publicKey);
      expect(swimPayloadFromVaa.owner).toEqual(provider.publicKey.toBuffer());

      // const guardianSetIndex: number = parsedTokenTransferVaa.guardianSetIndex;
      // const signatureSet = web3.Keypair.generate();
      // const verifySigIxs = await createVerifySignaturesInstructionsSolana(
      // 	provider.connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	tokenTransferWithPayloadSignedVaa,
      // 	signatureSet
      // );
      // // const verifyTxns: web3.Transaction[] = [];
      // const verifyTxnSigs: string[] = [];
      // const batchableChunks = chunks(verifySigIxs, 2);
      //
      // await Promise.all(batchableChunks.map(async (chunk) => {
      // 	let txn = new web3.Transaction();
      //   // const secp256k1Ix: TransactionInstruction = chunk[0];
      //   // const secp256k1IxData = secp256k1Ix.data;
      //   // const verifySigIx: TransactionInstruction = chunk[1];
      //   // const [
      //   //   _payer,
      //   //   guardianSet,
      //   //   signatureSet,
      //   //   sysvarIxs,
      //   //   sysvarsRent,
      //   //   sysProg
      //   // ] = verifySigIx.keys.map(k => k.pubkey);
      //   // const verifySigIxData = verifySigIx.data;
      //   // const verifySigData = verifySigIxData.slice(1); //first byte if verifySig ix enum
      //   // const secpAndVerifyTxn = propellerProgram
      //   //   .methods
      //   //   .secp256k1AndVerify(
      //   // secp256k1IxData,
      //   //     guardianSetIndex,
      //   //     verifySigData,
      //   //   )
      //   //   .accounts({
      //   //     secp256k1Program:  Secp256k1Program.programId,
      //   //     payer: payer.publicKey,
      //   //     guardianSet: guardianSet,
      //   //     signatureSet: signatureSet,
      //   //     instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      //   //     rent: web3.SYSVAR_RENT_PUBKEY,
      //   //     systemProgram: web3.SystemProgram.programId,
      //   //     wormhole,
      //   //   })
      //
      //
      // 	for (const chunkIx of chunk) {
      // 		txn.add(chunkIx);
      // 	}
      // 	// txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      // 	// txn.partialSign(signatureSet);
      // 	const txnSig = await provider.sendAndConfirm(txn, [signatureSet], confirmedCommitment);
      // 	console.info(`txnSig: ${txnSig} had ${chunk.length} instructions`);
      // 	verifyTxnSigs.push(txnSig);
      // }));
      // console.info(`verifyTxnSigs: ${JSON.stringify(verifyTxnSigs)}`);
      // await Promise.all(verifyTxnSigs.map(async (txnSig) => {
      // 	const info = await connection.getTransaction(txnSig, confirmedCommitment);
      // 	if (!info) {
      // 		throw new Error(
      // 			`An error occurred while fetching the transaction info for ${txnSig}`
      // 		);
      // 	}
      // 	// get the sequence from the logs (needed to fetch the vaa)
      // 	const logs = info.meta?.logMessages;
      // 	console.info(`${txnSig} logs: ${JSON.stringify(logs)}`);
      // }));
      //
      //
      // const postVaaIx = await createPostVaaInstructionSolana(
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	tokenTransferWithPayloadSignedVaa,
      // 	signatureSet
      // );
      // const postVaaTxn = new web3.Transaction().add(postVaaIx);
      // const postVaaTxnSig = await provider.sendAndConfirm(postVaaTxn, [], confirmedCommitment);
      // console.info(`postVaaTxnSig: ${postVaaTxnSig}`);
      // const postVaaTxnSigInfo = await connection.getTransaction(postVaaTxnSig, confirmedCommitment);
      // if (!postVaaTxnSigInfo) {
      // 	throw new Error(
      // 		`An error occurred while fetching the transaction info for ${postVaaTxnSig}`
      // 	);
      // }
      //
      // const postVaaIxMessageAcct = postVaaIx.keys[3].pubkey;

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

      // const wormholeMessage = web3.Keypair.generate();

      // TODO: this wasn't working for some reason. kept getting some wasm related error.
      // const { complete_transfer_native_ix } = await importTokenWasm();
      /*
       accounts: vec![
              AccountMeta::new(payer, true),
              AccountMeta::new_readonly(config_key, false),
              message_acc,
              claim_acc,
              AccountMeta::new_readonly(endpoint, false),
              AccountMeta::new(to, false),
              if let Some(fee_r) = fee_recipient {
                  AccountMeta::new(fee_r, false)
              } else {
                  AccountMeta::new(to, false)
              },
              AccountMeta::new(custody_key, false),
              AccountMeta::new_readonly(mint, false),
              AccountMeta::new_readonly(custody_signer_key, false),
              // Dependencies
              AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
              AccountMeta::new_readonly(solana_program::system_program::id(), false),
              // Program
              AccountMeta::new_readonly(bridge_id, false),
              AccountMeta::new_readonly(spl_token::id(), false),
          ],
       */
      // const complete_wrapped_accounts = ixFromRust(
      // 	complete_transfer_native_ix(
      // 		WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 		WORMHOLE_CORE_BRIDGE.toBase58(),
      // 		payer.publicKey.toBase58(),
      // 		tokenTransferWithPayloadSignedVaa
      // 	)
      // ).keys;
      const [messageAccount] = await deriveMessagePda(
        tokenTransferWithPayloadSignedVaa,
        WORMHOLE_CORE_BRIDGE,
      );

      // console.info(`
      // 	postVaaIxMessageAcct: ${postVaaIxMessageAcct.toBase58()}
      // 	messageAccount: ${messageAccount.toBase58()}
      // `)

      const messageAccountInfo = await connection.getAccountInfo(
        messageAccount,
      );
      if (!messageAccountInfo) {
        throw new Error("MessageAccountInfo is undefined");
      }
      // console.info(`messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`);
      /*
        vaa: 118,97,97
        msg: 109,115,103
        msu: 109,115,117
        let discriminators = ["vaa", "msg", "msu"];
        let txtEncoder = new TextEncoder();
        discriminators.forEach(discriminator => { console.info(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
       */
      // program.methods.Message.deserialize(messageAccountInfo.data);

      // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
      // const {
      // 	payload: postedMessagePayload2,
      // } = parsed2;
      // console.info(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
      // const {
      //   payload: postedVaaPayload,
      //   ...postedMessage
      // }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
      // console.info(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.info(`postedMessagePayload:\n${JSON.stringify(postedVaaPayload)}`);
      // const {
      //   payload: postedSwimPayload
      // } = postedVaaPayload;
      //
      // console.info(`postedSwimPayload:\n${JSON.stringify(postedSwimPayload)}`);
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
      const {
        tokenTransferMessage: {
          core: parsedMessage,
          tokenTransfer: parsedTokenTransferFromMessage,
        },
        swimPayload: swimPayloadFromMessage,
      } = parsedTokenTransferWithSwimPayloadPostedMessage;
      expect(parsedMessage.nonce).toEqual(parsedVaa.nonce);
      expect(parsedTokenTransferFromMessage.tokenChain).toEqual(
        CHAIN_ID_SOLANA,
      );
      expect(
        new web3.PublicKey(
          tryHexToNativeAssetString(
            parsedTokenTransferFromMessage.tokenAddress.toString("hex"),
            CHAIN_ID_SOLANA,
          ),
        ),
      ).toEqual(swimUsdKeypair.publicKey);
      expect(swimPayloadFromMessage.owner).toEqual(
        provider.publicKey.toBuffer(),
      );

      //   const messsageAccountInfo = await connection.getAccountInfo(messageAccount);
      //   const parsedTokenTransferSignedVaaFromAccount = await parseTokenTransferWithSwimPayloadPostedMessage(
      //     messsageAccountInfo!.data
      //   );
      //
      //   console.info(`parsedTokenTransferSignedVaaFromAccount:\n
      // 	${JSON.stringify(parsedTokenTransferSignedVaaFromAccount, null, 2)}
      // `);
      //   const emitterAddrUint8Arr = tryNativeToUint8Array(
      //     parsedTokenTransferSignedVaaFromAccount.emitter_address2,
      //     parsedTokenTransferSignedVaaFromAccount.emitter_chain
      //   );
      //   console.info(`
      // 	emitter_address2Pub: ${new web3.PublicKey(emitterAddrUint8Arr).toBase58()}
      // `);
      const [endpointAccount] = await deriveEndpointPda(
        parsedVaa.emitterChain,
        parsedVaa.emitterAddress,
        // Buffer.from(new web3.PublicKey(parsedTokenTransferVaa.emitter_address).toBase58()),
        WORMHOLE_TOKEN_BRIDGE,
      );
      console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
      const claimAddressPubkey = await getClaimAddressSolana(
        WORMHOLE_TOKEN_BRIDGE.toBase58(),
        tokenTransferWithPayloadSignedVaa,
      );
      // const messageAccount = complete_wrapped_accounts[2]!.pubkey;
      // const claimAccount = complete_wrapped_accounts[3]!.pubkey;
      // const { claim_address } = await importCoreWasm();
      // const claimAddressWasm = claim_address(
      //   WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa
      // );
      // const claimAddressPubkey2 = new web3.PublicKey(claimAddressWasm);
      // const claimAddressPubkey3 = new web3.PublicKey(
      //   tryUint8ArrayToNative(
      //     claimAddressWasm,
      //     CHAIN_ID_SOLANA
      //   )
      // );
      // // expect(claimAccount).to.deep.equal(claimAddressPubkey);
      //
      // // const signedVaaHash = await getSignedVAAHash(tokenTransferWithPayloadSignedVaa);
      // // const [claimAddressPubkey3] = await web3.PublicKey.findProgramAddress(
      // //   [Buffer.from(signedVaaHash)], WORMHOLE_TOKEN_BRIDGE
      // // )
      // console.info(`
      //   claimAddressPubkey: ${claimAddressPubkey.toBase58()}
      //   claimAddressPubkey2: ${claimAddressPubkey2.toBase58()}
      //   claimAddressPubkey3: ${claimAddressPubkey3.toBase58()}
      // `);
      // expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey2);
      // expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey3);

      const propellerCompleteNativeWithPayloadTxn =
        await propellerProgram.methods
          .completeNativeWithPayload()
          .accounts({
            propeller,
            payer: payer.publicKey,
            tokenBridgeConfig,
            // userTokenBridgeAccount: userLpTokenAccount.address,
            message: messageAccount,
            claim: claimAddressPubkey,
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
            wormhole,
            tokenProgram: splToken.programId,
            tokenBridge,
          })
          .preInstructions([requestUnitsIx])
          .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        propellerCompleteNativeWithPayloadTxn,
        [payer],
        {
          skipPreflight: true,
        },
      );

      const transferNativeTxnSize =
        propellerCompleteNativeWithPayloadTxn.serialize().length;
      console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`);
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const propellerRedeemerEscrowAccountAfter = (
        await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      ).amount;
      console.info(`
      propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}
      propellerRedeemerEscrowAccountAfter: ${propellerRedeemerEscrowAccountAfter.toString()}
    `);
      expect(
        propellerRedeemerEscrowAccountAfter.gt(
          propellerRedeemerEscrowAccountBefore,
        ),
      ).toEqual(true);

      // const propellerCompleteToUserTxn = await propellerProgram
      //   .methods
      //   .completeToUser()
      //   .accounts({
      //     propeller,
      //     payer: payer.publicKey,
      //     message: messageAccount,
      //     // redeemer: propellerRedeemer,
      //     feeRecipient: propellerRedeemerEscrowAccount,
      //     pool: flagshipPool,
      //     poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
      //     poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
      //     poolProgram: TWO_POOL_PROGRAM_ID,
      //     // tokenBridgeMint,
      //     // custody: custody,
      //     // mint: tokenBridgeMint,
      //     // custodySigner,
      //     // rent: web3.SYSVAR_RENT_PUBKEY,
      //     // systemProgram: web3.SystemProgram.programId,
      //     // wormhole,
      //     // tokenProgram: splToken.programId,
      //     // tokenBridge,
      //     aggregator: aggregatorKey,
      //   }).rpc();
      // expect(propellerRedeemerEscrowAccountAfter).to.equal(propellerRedeemerEscrowAccountBefore - transferNativeTxnSize);

      //
      // const redeemTxn = await redeemOnSolana(
      // 	connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	Uint8Array.from(tokenTransferWithPayloadSignedVaa)
      // );
      // const redeemSig = await provider.sendAndConfirm(redeemTxn, [], {
      // 	skipPreflight: true
      // });
      // console.info(`redeemSig: ${redeemSig}`);
      //
      // const userLpTokenAccountBalanceAfter = (await splToken.account.token.fetch(userLpTokenAccount.address)).amount;
      //
      // // amount: 100_000_000
      // // userLpTokenAccountBalanceBefore: 100
      // // userLpTokenAccountBalanceAfter: 100_000_100
      //
      // console.info(`
      // 	amount: ${amount.toString()}
      // 	userLpTokenAccountBalanceBefore: ${userLpTokenAccountBalanceBefore.toString()}
      // 	userLpTokenAccountBalanceAfter: ${userLpTokenAccountBalanceAfter.toString()}
      // `);
      // const expectedAmount = userLpTokenAccountBalanceBefore.add(new BN(amount.toString()));
      // assert(userLpTokenAccountBalanceAfter.eq(expectedAmount));
    });
  });

  async function checkTxnLogsForMemo(txSig: string, memoString: string) {
    console.info(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });
    if (!txnInfo.meta.logMessages) {
      throw new Error("txnInfo undefined");
    }
    const txnLogs = txnInfo.meta.logMessages;
    const memoLog = txnLogs.find((log) => log.startsWith("Program log: Memo"));
    expect(memoLog.includes(memoString)).toEqual(true);
  }
});

// type PoolUserBalances = {
//   readonly poolTokenBalances: ReadonlyArray<BN>;
//   readonly userTokenBalances: ReadonlyArray<BN>;
//   readonly governanceFeeBalance: BN;
//   readonly userLpTokenBalance: BN;
//   readonly previousDepth: BN;
// };
// async function getFlagshipTokenAccountBalances(): Promise<PoolUserBalances> {
//   const poolUsdcAtaBalance = (
//     await splToken.account.token.fetch(poolUsdcAtaAddr)
//   ).amount;
//   const poolUsdtAtaBalance = (
//     await splToken.account.token.fetch(poolUsdtAtaAddr)
//   ).amount;
//   const governanceFeeBalance = (
//     await splToken.account.token.fetch(governanceFeeAddr)
//   ).amount;
//   const userUsdcAtaBalance = (
//     await splToken.account.token.fetch(userUsdcAtaAddr)
//   ).amount;
//   const userUsdtAtaBalance = (
//     await splToken.account.token.fetch(userUsdtAtaAddr)
//   ).amount;
//   const userLpTokenBalance = (
//     await splToken.account.token.fetch(userSwimUsdAtaAddr)
//   ).amount;
//   const previousDepth = (
//     await twoPoolProgram.account.twoPool.fetch(flagshipPool)
//   ).previousDepth;
//   return {
//     poolTokenBalances: [poolUsdcAtaBalance, poolUsdtAtaBalance],
//     governanceFeeBalance,
//     userTokenBalances: [userUsdcAtaBalance, userUsdtAtaBalance],
//     userLpTokenBalance,
//     previousDepth,
//   };
// }
//
// function printBeforeAndAfterPoolUserBalances(
//   poolUserBalances: ReadonlyArray<PoolUserBalances>,
// ) {
//   const {
//     poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
//     governanceFeeBalance: governanceFeeBalanceBefore,
//     userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
//     userLpTokenBalance: userLpTokenBalanceBefore,
//     previousDepth: previousDepthBefore,
//   } = poolUserBalances[0];
//   const {
//     poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
//     governanceFeeBalance: governanceFeeBalanceAfter,
//     userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
//     userLpTokenBalance: userLpTokenBalanceAfter,
//     previousDepth: previousDepthAfter,
//   } = poolUserBalances[1];
//   console.info(`
//     poolUsdcAtaBalance:
//       before: ${poolUsdcAtaBalanceBefore.toString()},
//       after: ${poolUsdcAtaBalanceAfter.toString()}
//     poolUsdtAtaBalance:
//       before: ${poolUsdtAtaBalanceBefore.toString()},
//       after: ${poolUsdtAtaBalanceAfter.toString()}
//     governanceFeeBalance:
//       before: ${governanceFeeBalanceBefore.toString()},
//       after: ${governanceFeeBalanceAfter.toString()}
//     userUsdcAtaBalance:
//       before: ${userUsdcAtaBalanceBefore.toString()},
//       after: ${userUsdcAtaBalanceAfter.toString()}
//     userUsdtAtaBalance:
//       before: ${userUsdtAtaBalanceBefore.toString()},
//       after: ${userUsdtAtaBalanceAfter.toString()}
//     userLpTokenBalance:
//       before: ${userLpTokenBalanceBefore.toString()},
//       after: ${userLpTokenBalanceAfter.toString()}
//     previousDepth:
//       before: ${previousDepthBefore.toString()},
//       after: ${previousDepthAfter.toString()}
//   `);
// }
// async function getPropellerPda(mint: web3.PublicKey): Promise<web3.PublicKey> {
// 	return (await web3.PublicKey.findProgramAddress(
// 		[Buffer.from("propeller"), mint.toBytes()],
// 		propellerProgram.programId,
// 	))[0];
// }
//
// async function getPropellerRedeemerPda(): Promise<web3.PublicKey> {
// 	return (await web3.PublicKey.findProgramAddress(
// 		[Buffer.from("redeemer")],
// 		propellerProgram.programId,
// 	))[0];
// }
//
// async function getPropellerSenderPda(): Promise<web3.PublicKey> {
// 	return (await web3.PublicKey.findProgramAddress([Buffer.from("sender")], propellerProgram.programId,
//     )
//   )[0];
// }
//
// async function addToPool(
// 	provider: AnchorProvider,
// 	pool: web3.PublicKey,
// 	poolState: SwimPoolState,
// 	userTokenAccounts: web3.PublicKey[],
// 	userLpTokenAccount: web3.PublicKey,
// 	inputAmounts: BN[],
// 	minimumMintAmount: BN,
// 	tokenAccountOwner: web3.Keypair,
// 	delegate: web3.PublicKey,
// ): Promise<string> {
// 	// let userMetapoolTokenAccountAmounts = await Promise.all(
// 	//     userMetapoolTokenAccounts.map(async (account) => {
// 	//     return (await splToken.account.token.fetch(account)).amount;
// 	// }));
// 	// console.info(`userMetapoolTokenAccountAmounts: ${userMetapoolTokenAccountAmounts}`)
// 	// let userMetapoolTokenAccounts0Amount = await splToken.account.token.fetch(userMetapoolTokenAccounts[0]);
// 	// let inputAmounts = [new BN(100), new BN(100)];
//
// 	const addMetapoolIx = addToPoolIx(
// 		{
// 			provider,
// 			pool,
// 			poolState,
// 			userTokenAccounts,
// 			userLpTokenAccount,
// 			inputAmounts,
// 			minimumMintAmount,
// 		});
// 	const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
// 		BN.max(inputAmounts[0]!, inputAmounts[1]!),
// 		tokenAccountOwner.publicKey,
// 		delegate,
// 		userTokenAccounts
// 	);
// 	const seedMetapoolTxn = new web3.Transaction()
// 		.add(...approveIxs!)
// 		.add(addMetapoolIx)
// 		.add(...revokeIxs!);
// 	seedMetapoolTxn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
// 	return await provider.sendAndConfirm(
// 		seedMetapoolTxn,
// 		[dummyUser],
// 		{
// 			skipPreflight: true,
// 		}
// 	);
// }
//
// async function createAtaAndMint(mint: web3.PublicKey) {
// 	const tokenAccount = await getOrCreateAssociatedTokenAccount(
// 		connection,
// 		payer,
// 		mint,
// 		dummyUser.publicKey,
// 		false
// 	);
// 	const mintTxn = await mintTo(
// 		connection,
// 		payer,
// 		mint,
// 		tokenAccount.address,
// 		payer,
// 		initialMintAmount,
// 	);
//
// 	await connection.confirmTransaction({
// 		signature: mintTxn,
// 		...(await connection.getLatestBlockhash())
// 	})
// 	console.info(`minted to user_token_account: ${tokenAccount.address.toBase58()}`);
// 	return tokenAccount
// }

// const parseTokenTransferWithSwimPayloadPostedMessage = async (arr: Buffer) => {
// 	const {parse_posted_message} = await importCoreWasm();
// 	const postedMessage = parse_posted_message(arr);
// 	const tokenTransfer = parseTransferWithPayload(Buffer.from(postedMessage.payload));
//   // console.info(`swimPayloadRawBufferStr: ${tokenTransfer.payload.toString()}`);
//   const swimPayload = parseSwimPayload(tokenTransfer.payload);
// 	return {
// 		...postedMessage,
// 		vaa_signature_account: new web3.PublicKey(postedMessage.vaa_signature_account).toBase58(),
// 		// emitter_address: tryHexToNativeAssetString(postedMessage.emitter_address, postedMessage.emitter_chain),
// 		// emitter_address: new web3.PublicKey(postedMessage.emitter_address).toBase58(),
// 		emitter_address: tryUint8ArrayToNative(postedMessage.emitter_address, postedMessage.emitter_chain),
//
// 		payload: {
// 			...tokenTransfer,
// 			amount: tokenTransfer.amount.toString(),
// 			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
// 			originChain: toChainName(tokenTransfer.originChain),
// 			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
// 			targetChain: toChainName(tokenTransfer.targetChain),
// 			fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, postedMessage.emitter_chain),
//       payload: {
//         ...swimPayload,
//         minOutputAmount: swimPayload.minOutputAmount.toString(),
//         memo: swimPayload.memo.toString(),
//         propellerMinThreshold: swimPayload.propellerMinThreshold.toString(),
//         // propellerFee: swimPayload.propellerFee.toString(),
//         // targetTokenStr: swimPayload.targetToken.toString(),
//         // targetTokenHexStr: swimPayload.targetToken.toString("hex"),
//         // ownerStr: swimPayload.owner.toString(),
//         ownerNativeStr: tryHexToNativeAssetString(swimPayload.owner.toString("hex"), tokenTransfer.targetChain),
//         // ownerHexStr: swimPayload.owner.toString("hex"),
//       }
// 		}
// 	}
// }

//   1 byte - swim internal payload version number
// 32 bytes - logical owner/recipient (will use ATA of owner and token on Solana)
//  2 bytes - swimTokenNumber (support up to 65k different tokens, just to be safe)
// 32 bytes - minimum output amount (using 32 bytes like Wormhole)
// 16 bytes - memo/interactionId (??) (current memo is 16 bytes - can't use Wormhole sequence due to Solana originating transactions (only receive sequence number in last transaction on Solana, hence no id for earlier transactions))
// ?? bytes - propeller parameters (propellerEnabled: bool / gasTokenPrefundingAmount: uint256 / propellerFee (?? - similar to wormhole arbiter fee))
// export interface ParsedSwimPayload {
//   version: number;
//   owner: Buffer;
//   targetTokenId: number;
//   minOutputAmount: bigint; //this will always be 0 in v1
//   memo: Buffer;
//   // targetToken: Buffer; //mint of expected final output token
//   // gas: string;
//   // keeping this as string for now since JSON.stringify poos on bigints
//   // minOutputAmount: string; //this will always be 0 in v1
//   propellerEnabled: boolean;
//   propellerMinThreshold: bigint;
//   // propellerFee: bigint;
//   // propellerFee: string;
//   gasKickstart: boolean;
// }
//
// export function encodeSwimPayload(
//   swimPayload: ParsedSwimPayload
// ): Buffer {
//   const encoded = Buffer.alloc(
//     1 + //version
//     2 + //targetTokenId (u16)
//     // 32 + //targetToken
//     32 + //owner
//     // 32 + //gas
//     32 + //minOutputAmount
//     16 + //memo
//     1 + //propellerEnabled
//     32 + //propellerMinThreshold
//     // 32 + //propellerFee
//     1 //gasKickstart
//   );
//   let offset = 0;
//   encoded.writeUint8(swimPayload.version, offset);
//   offset++;
//   encoded.writeUint16BE(swimPayload.targetTokenId, offset);
//   offset += 2;
//   // encoded.write(swimPayload.targetToken.toString("hex"), 3, "hex");
//   encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
//   offset += 32;
//   // encoded.write(toBigNumberHex(swimPayload.gas, 32), 67, "hex");
//   encoded.write(toBigNumberHex(swimPayload.minOutputAmount, 32), offset, "hex");
//   offset += 32;
//   encoded.write(swimPayload.memo.toString("hex"), offset, "hex");
//   offset += 16;
//   encoded.writeUint8(Number(swimPayload.propellerEnabled), offset);
//   offset++
//   encoded.write(toBigNumberHex(swimPayload.propellerMinThreshold, 32), offset, "hex");
//   offset += 32;
//   // encoded.write(toBigNumberHex(swimPayload.propellerFee, 32), 100, "hex");
//   encoded.writeUint8(Number(swimPayload.gasKickstart), offset);
//   return encoded;
// }
//
// export function parseSwimPayload(arr: Buffer): ParsedSwimPayload {
//   //BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt()
//   let offset = 0;
//   const version = arr.readUint8(offset);
//   offset++;
//   const targetTokenId = arr.readUint16BE(offset);
//   offset += 2;
//   // const targetToken = arr.subarray(offset, offset + 32);
//   // offset += 32;
//   const owner = arr.subarray(offset, offset + 32);
//   offset += 32;
//   const minOutputAmount = parseU256(arr.subarray(offset, offset + 32));
//   offset += 32;
//   const memo = arr.subarray(offset, offset + 16);
//   offset += 16;
//   const propellerEnabled = arr.readUint8(offset) === 1;
//   offset++;
//   const propellerMinThreshold = parseU256(arr.subarray(offset, offset + 32));
//   offset += 32;
//   // const propellerFee = parseU256(arr.subarray(offset, offset + 32));
//   // offset += 32;
//   const gasKickstart = arr.readUint8(offset) === 1;
//   offset++;
//   return {
//     version,
//     targetTokenId,
//     // targetToken,
//     owner,
//     minOutputAmount,
//     memo,
//     propellerEnabled,
//     propellerMinThreshold,
//     gasKickstart,
//   }
//   // return {
//   //   version: arr.readUint8(0),
//   //   targetTokenId: arr.readUint16BE(1),
//   //   targetToken: arr.subarray(3, 3 + 32),
//   //   owner: arr.subarray(35, 35 + 32),
//   //   minOutputAmount: BigNumber.from(arr.subarray(67, 67 + 32)).toBigInt(),
//   //   // minOutputAmount: arr.readBigUInt64BE(67),
//   //   propellerEnabled: arr.readUint8(99) === 1,
//   //   // propellerFee: arr.readBigUInt64BE(100),
//   //   propellerFee: BigNumber.from(arr.subarray(100, 100 + 32)).toBigInt(),
//   //   gasKickstart: arr.readUint8(132) === 1,
//   // }
// }
//
// export function parseU256(arr: Buffer): bigint {
//   return BigNumber.from(arr.subarray(0, 32)).toBigInt();
// }
//
// export interface ParsedTokenTransferWithSwimPayloadVaa {
//   // core: ParsedVaa,
//   // tokenTransfer: ParsedTokenTransfer;
//   tokenTransferVaa: ParsedTokenTransferSignedVaa;
//   swimPayload: ParsedSwimPayload;
// }
// const parseTokenTransferWithSwimPayloadSignedVaa = (signedVaa: Buffer): ParsedTokenTransferWithSwimPayloadVaa => {
//   const parsedTokenTransfer = parseTokenTransferSignedVaa(signedVaa);
//   const payload = parsedTokenTransfer.tokenTransfer.payload;
//   const swimPayload = parseSwimPayload(payload);
//   return {
//     tokenTransferVaa: parsedTokenTransfer,
//     swimPayload,
//   }
// }
//
// const formatParsedTokenTransferWithSwimPayloadVaa = (parsed: ParsedTokenTransferWithSwimPayloadVaa) => {
//   const formattedTokenTransfer = formatParsedTokenTransferSignedVaa(parsed.tokenTransferVaa);
//   const swimPayload = parsed.swimPayload;
//   const formattedSwimPayload = formatSwimPayload(swimPayload, parsed.tokenTransferVaa.tokenTransfer.toChain);
//   return {
//     ...formattedTokenTransfer,
//     ...formattedSwimPayload,
//   };
// }
//
// const formatSwimPayload = (swimPayload: ParsedSwimPayload, chain: ChainId | ChainName) => {
//   return {
//     ...swimPayload,
//     minOutputAmount: swimPayload.minOutputAmount.toString(),
//     memo: swimPayload.memo.toString(),
//     propellerMinThreshold: swimPayload.propellerMinThreshold.toString(),
//     owner: tryUint8ArrayToNative(swimPayload.owner, chain)
//   }
// }
//
// export interface ParsedTokenTransferWithSwimPayloadPostedMessage {
//   tokenTransferMessage: ParsedTokenTransferPostedMessage;
//   swimPayload: ParsedSwimPayload;
// }
//
// const parseTokenTransferWithSwimPayloadPostedMessage = async (message: Buffer): Promise<ParsedTokenTransferWithSwimPayloadPostedMessage> => {
//   const parsedTokenTransferMsg = await parseTokenTransferPostedMessage(message);
//   const payload = parsedTokenTransferMsg.tokenTransfer.payload;
//   const swimPayload = parseSwimPayload(payload);
//   return {
//     tokenTransferMessage: parsedTokenTransferMsg,
//     swimPayload,
//   }
// }
//
// const formatParsedTokenTransferWithSwimPayloadPostedMessage = (parsed: ParsedTokenTransferWithSwimPayloadPostedMessage) => {
//   const formattedTokenTransfer = formatParsedTokenTransferPostedMessage(parsed.tokenTransferMessage);
//   const swimPayload = parsed.swimPayload;
//   const formattedSwimPayload = formatSwimPayload(swimPayload, parsed.tokenTransferMessage.tokenTransfer.toChain);
//   return {
//     ...formattedTokenTransfer,
//     ...formattedSwimPayload,
//   };
//
// }

// const parseTransferWithPayload = (arr: Buffer) => (
//   {
//     amount: BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt(),
//     originAddress: arr.subarray(33, 33 + 32).toString("hex"),
//     originChain: arr.readUInt16BE(65) as ChainId,
//     targetAddress: arr.subarray(67, 67 + 32).toString("hex"),
//     targetChain: arr.readUInt16BE(99) as ChainId,
//     fromAddress: arr.subarray(101, 101 + 32).toString("hex"),
//     payload: arr.subarray(133),
//   }
// );
//
// const parseTokenTransferVaa = async (arr: Buffer) => {
// 	const {parse_vaa} = await importCoreWasm();
// 	const parsedVaa = parse_vaa(arr);
// 	const tokenTransfer = parseTransferWithPayload(Buffer.from(parsedVaa.payload));
// 	return {
// 		...parsedVaa,
// 		// signatures: parsedVaa.signatures.map(sig => sig.toString("hex")),
// 		// vaa_signature_account: new web3.PublicKey(parsedVaa.vaa_signature_account).toBase58(),
// 		// emitter_address: new web3.PublicKey(parsedVaa.emitter_address).toBase58(),
// 		// emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, CHAIN_ID_ETH),
// 		emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, parsedVaa.emitter_chain),
// 		// signatures: parsedVaa.signatures.map(sig => {
// 		// 	return {
// 		// 		sig.signature.toString("hex")
// 		// 	}
// 		// }),
// 		payload: {
// 			...tokenTransfer,
// 			amount: tokenTransfer.amount.toString(),
// 			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
// 			originChain: toChainName(tokenTransfer.originChain),
// 			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
// 			targetChain: toChainName(tokenTransfer.targetChain),
// 			// fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, CHAIN_ID_ETH),
// 		}
// 	}
// }

/*

   when calling TokenBridge::TransferWithPayload, amount is in u64. TokenBridge handles
   decimal conversion /truncation

      const amount = parseUnits("1", 9).toBigInt();
       const transaction = await transferFromSolana(
		connection,
         SOLANA_CORE_BRIDGE_ADDRESS,
         SOLANA_TOKEN_BRIDGE_ADDRESS,
         payerAddress,
         fromAddress,
        TEST_SOLANA_TOKEN,
         amount,
         tryNativeToUint8Array(targetAddress, CHAIN_ID_ETH),
         CHAIN_ID_ETH
       );
*/
// Notes

// function uint8arrayEqualityCheck(a: Uint8Array, b: Uint8Array): boolean {
//   if (a.constructor.name !== 'Uint8Array' || b.constructor.name !== 'Uint8Array') {
//     return false;
//   }
//
//   if (a.length !== b.length) {
//     return false;
//   }
//
//   for (let i = 0; i < a.length; i++) {
//     if (a[i] !== b[i]) {
//       return false;
//     }
//   }
//
//   return true;
// };
