// import {
//   CHAIN_ID_ETH,
//   CHAIN_ID_SOLANA,
//   ChainId,
//   ChainName,
//   attestFromSolana,
//   chunks,
//   createNonce,
//   createPostVaaInstructionSolana,
//   createVerifySignaturesInstructionsSolana,
//   getClaimAddressSolana,
//   getEmitterAddressSolana,
//   getForeignAssetEth,
//   getSignedVAAHash,
//   importCoreWasm,
//   importTokenWasm,
//   ixFromRust,
//   parseSequenceFromLogSolana,
//   parseTransferPayload,
//   postVaaSolanaWithRetry,
//   redeemOnSolana,
//   setDefaultWasm,
//   toChainName,
//   tryHexToNativeAssetString,
//   tryHexToNativeString,
//   tryNativeToHexString,
//   tryNativeToUint8Array,
// } from "@certusone/wormhole-sdk";
// import { tryUint8ArrayToNative } from "@certusone/wormhole-sdk/lib/cjs/utils/array";
// import type { Program } from "@project-serum/anchor";
// import * as anchor from "@project-serum/anchor";
// import { Spl, web3 } from "@project-serum/anchor";
// import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
// import type { Account } from "@solana/spl-token";
// import {
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   TOKEN_PROGRAM_ID,
//   getAccount,
//   getAssociatedTokenAddress,
//   getOrCreateAssociatedTokenAccount,
//   mintTo,
// } from "@solana/spl-token";
// import {
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SYSVAR_INSTRUCTIONS_PUBKEY,
//   Secp256k1Program,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";
// import * as byteify from "byteify";
// import { assert, expect } from "chai";
// import { BigNumber } from "ethers";
// import { parseUnits } from "ethers/lib/utils";
//
// import { getApproveAndRevokeIxs } from "../../src";
// import type { Propeller } from "../../src/artifacts/propeller";
// import type { TwoPool } from "../../src/artifacts/two_pool";
// import {
//   setupPoolPrereqs,
//   setupUserAssociatedTokenAccts,
// } from "../twoPool/poolTestUtils";
//
// import {
//   MintInfo,
//   TWO_POOL_PROGRAM_ID,
//   addToPoolIx,
//   deserializeSwimPool,
//   initalizeTwoPoolV2,
// } from "./pool-utils";
// import type { SwimPoolState } from "./pool-utils";
// import {
//   encodeSwimPayload,
//   formatParsedTokenTransferWithSwimPayloadPostedMessage,
//   formatParsedTokenTransferWithSwimPayloadVaa,
//   getPropellerPda,
//   getPropellerRedeemerPda,
//   getPropellerSenderPda,
//   parseTokenTransferWithSwimPayloadPostedMessage,
//   parseTokenTransferWithSwimPayloadSignedVaa,
// } from "./propellerUtils";
// import {
//   ParsedTokenTransfer,
//   ParsedTokenTransferPostedMessage,
//   ParsedTokenTransferSignedVaa,
//   deriveEndpointPda,
//   deriveMessagePda,
//   encodeAttestMeta,
//   encodeTokenTransfer,
//   encodeTokenTransferWithPayload,
//   formatParsedTokenTransferPostedMessage,
//   formatParsedTokenTransferSignedVaa,
//   getMintMetaPdas,
//   parseTokenTransferPostedMessage,
//   parseTokenTransferSignedVaa,
//   toBigNumberHex,
// } from "./tokenBridgeUtils";
// import {
//   ParsedVaa,
//   WORMHOLE_CORE_BRIDGE,
//   WORMHOLE_TOKEN_BRIDGE,
//   formatParsedVaa,
//   parseVaa,
//   signAndEncodeVaa,
// } from "./wormholeUtils";
// import type {Program} from "@project-serum/anchor";
// import * as anchor from "@project-serum/anchor";
// import { web3, Spl, AnchorError } from "@project-serum/anchor";
// import {
//     MintInfo, SwimPoolState
// } from "./pool-utils";
import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryHexToNativeAssetString,
  tryNativeToHexString,
  // uint8ArrayToHex,
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
// import {
//   tryUint8ArrayToNative,
//   uint8ArrayToHex,
// } from "@certusone/wormhole-sdk/lib/cjs/utils/array";
// import type { Program } from "@project-serum/anchor";
// import * as anchor from "@project-serum/anchor";
// import { Spl, web3 } from "@project-serum/anchor";
// import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
// import type { Account ,
//   Account} from "@solana/spl-token";
// import {
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   TOKEN_PROGRAM_ID,
//   getAccount,
//   getAssociatedTokenAddress,
//   getOrCreateAssociatedTokenAccount,
//
// } from "@solana/spl-token";
// import {
//   LAMPORTS_PER_SOL,
//   PublicKey,
// } from "@solana/web3.js";
// import type { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";
// import * as byteify from "byteify";
// import { assert, expect } from "chai";
// import { BigNumber } from "ethers";
// import { parseUnits } from "ethers/lib/utils";
//
// import { getApproveAndRevokeIxs } from "../../src";
// import type { Propeller } from "../../src/artifacts/propeller";
// import type { TwoPool } from "../../src/artifacts/two_pool";
// import {
//   setupPoolPrereqs,
//   setupUserAssociatedTokenAccts,
// } from "../twoPool/poolTestUtils";
//
// import type { MintInfo, SwimPoolState } from "./pool-utils";

import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
// eslint-disable-next-line import/order
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
// import type { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";

import { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";

import { getApproveAndRevokeIxs } from "../../src";
import type { Propeller } from "../../src/artifacts/propeller";
import type { TwoPool } from "../../src/artifacts/two_pool";
import {
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  formatParsedTokenTransferWithSwimPayloadVaa,
  // getFlagshipTokenAccountBalances,
  // getPropellerPda,
  getPropellerRedeemerPda,
  // getPropellerSenderPda,
  parseTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadSignedVaa,
  // printBeforeAndAfterPoolUserBalances,
} from "./propellerUtils";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeTokenTransferWithPayload,
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

// import {getAssociatedTokenAddress} from "@solana/spl-token/src/state";

// import {WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE} from "./wormhole_utils";

setDefaultWasm("node");

// const envProvider = anchor.AnchorProvider.env();
//
// const confirmedCommitment = { commitment: "confirmed" as web3.Finality };
// const commitment = "confirmed" as web3.Commitment;
// const rpcCommitmentConfig = {
//   commitment,
//   preflightCommitment: commitment,
//   skipPreflight: true,
// };
// const provider = new anchor.AnchorProvider(
//   envProvider.connection,
//   envProvider.wallet,
//   rpcCommitmentConfig,
// );
// const connection = provider.connection;
// const payer = (provider.wallet as NodeWallet).payer;
// const splToken = Spl.token(provider);
// const splAssociatedToken = Spl.associatedToken(provider);
// // Configure the client to use the local cluster.
// anchor.setProvider(provider);
//
// const propellerProgram = anchor.workspace.Propeller as Program<Propeller>;
// const twoPoolProgram = anchor.workspace.TwoPool as Program<TwoPool>;
//
// const wormhole = WORMHOLE_CORE_BRIDGE;
// const tokenBridge = WORMHOLE_TOKEN_BRIDGE;
//
// let ethTokenBridgeSequence = 0n;
//
// const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
// //0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
// const ethTokenBridgeEthHexStr = tryNativeToHexString(
//   ethTokenBridgeStr,
//   CHAIN_ID_ETH,
// );
// //ethTokenBridge.toString() = gibberish
// // ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
// const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");
//
// const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
// const ethRoutingContractEthHexStr = tryNativeToHexString(
//   ethRoutingContractStr,
//   CHAIN_ID_ETH,
// );
// const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(
//   ethRoutingContractStr,
//   CHAIN_ID_ETH,
// );
// const ethRoutingContract = Buffer.from(ethRoutingContractEthHexStr, "hex");
//
// const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
//   // units: 420690,
//   units: 900000,
//   additionalFee: 0,
// });
//
// let metapool: web3.PublicKey;
// let metapoolData: SwimPoolState;
// let metapoolAuth: web3.PublicKey;
// let userMetapoolTokenAccount0: web3.PublicKey;
// let userMetapoolTokenAccount1: web3.PublicKey;
// let userMetapoolLpTokenAccount: web3.PublicKey;
//
// let propeller: web3.PublicKey;
// let propellerSender: web3.PublicKey;
// let propellerRedeemer: web3.PublicKey;
// let propellerRedeemerEscrowAccount: Account;
// const propellerAdmin: web3.Keypair = web3.Keypair.generate();
//

// const initialMintAmount = 100_000_000_000_000;
// // const usdcMintInfo: MintInfo = {
// //     mint: web3.Keypair.generate(),
// //     decimals: 6,
// //     mintAuth: user.publicKey,
// // };
// // const usdtMintInfo: MintInfo = {
// //     mint: web3.Keypair.generate(),
// //     decimals: 6,
// //     mintAuth: user.publicKey
// // };
//
// const mintDecimal = 6;
//
// const usdcKeypair = web3.Keypair.generate();
// const usdtKeypair = web3.Keypair.generate();
// const poolMintKeypairs = [usdcKeypair, usdtKeypair];
// const poolMintDecimals = [mintDecimal, mintDecimal];
// const poolMintAuthorities = [payer, payer];
// const swimUsdKeypair = web3.Keypair.generate();
// const governanceKeypair = web3.Keypair.generate();
// const pauseKeypair = web3.Keypair.generate();
//
// let poolUsdcAtaAddr: web3.PublicKey;
// let poolUsdtAtaAddr: web3.PublicKey;
// let flagshipPoolGovernanceFeeAddr: web3.PublicKey;
// //
// // let userUsdcAtaAddr: web3.PublicKey;
// // let userUsdtAtaAddr: web3.PublicKey;
// // let userSwimUsdAtaAddr: web3.PublicKey;
// // const ampFactor = { value: new BN(300), decimals: 0 };
// // const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
// // const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps
// //
// // let flagshipPool: web3.PublicKey;
// // const flagshipPoolLpMint: web3.PublicKey = swimUsdKeypair.publicKey;
// // // let flagshipPoolData: SwimPoolState;
// // // let poolAuth: web3.PublicKey;
// // const tokenBridgeMint: web3.PublicKey = swimUsdKeypair.publicKey;
// //
// const metapoolMint0Keypair = swimUsdKeypair;
// const metapoolMint1Keypair = web3.Keypair.generate();
// const metapoolMint1Authority = payer;
// const metapoolMint1Decimal = 8;
// const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
// const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];
// const metapoolMintAuthorities = [flagshipPool, metapoolMint1Authority];

// const metapoolLpMintKeypair = web3.Keypair.generate();
// let metapoolPoolTokenAta0: web3.PublicKey;
// let metapoolPoolTokenAta1: web3.PublicKey;
// let metapoolGovernanceFeeAta: web3.PublicKey;
//
// const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
// const propellerFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
// const propellerMinTransferAmount = new BN(5_000_000);
// const propellerEthMinTransferAmount = new BN(10_000_000);
// let marginalPricePool: web3.PublicKey;
// // USDC token index in flagship pool
// const marginalPricePoolTokenIndex = 0;
// const marginalPricePoolTokenMint = usdcKeypair.publicKey;

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

const user = payer;
console.info(`dummyUser: ${user.publicKey.toBase58()}`);
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
// let governanceFeeAddr: web3.PublicKey;

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

// const metapoolMintKeypair0 = swimUsdKeypair;
// const metapoolMintKeypair1 = web3.Keypair.generate();
// const metapoolMintAuthority1 = payer;
// const metapoolMintDecimal1 = 8;
// const metapoolMintKeypairs = [metapoolMintKeypair0, metapoolMintKeypair1];
// const metapoolMintDecimals = [mintDecimal, metapoolMintDecimal1];
// const metapoolMintAuthorities = [flagshipPool, metapoolMintAuthority1];

const metapoolLpMintKeypair = web3.Keypair.generate();
let metapoolPoolTokenAta0: web3.PublicKey;
let metapoolPoolTokenAta1: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

let flagshipPoolGovernanceFeeAddr: web3.PublicKey;
//
// let userUsdcAtaAddr: web3.PublicKey;
// let userUsdtAtaAddr: web3.PublicKey;
// let userSwimUsdAtaAddr: web3.PublicKey;
// const ampFactor = { value: new BN(300), decimals: 0 };
// const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
// const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps
//
// let flagshipPool: web3.PublicKey;
// const flagshipPoolLpMint: web3.PublicKey = swimUsdKeypair.publicKey;
// // let flagshipPoolData: SwimPoolState;
// // let poolAuth: web3.PublicKey;
// const tokenBridgeMint: web3.PublicKey = swimUsdKeypair.publicKey;
//
const metapoolMint0Keypair = swimUsdKeypair;
const metapoolMint1Keypair = web3.Keypair.generate();
const metapoolMint1Authority = payer;
const metapoolMint1Decimal = 8;
const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];

const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
const propellerMinTransferAmount = new BN(5_000_000);
const propellerEthMinTransferAmount = new BN(10_000_000);
let marginalPricePool: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey;
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;

const evmTargetTokenId = 2;
const evmOwnerEthHexStr = tryNativeToHexString(
  "0x0000000000000000000000000000000000000004",
  CHAIN_ID_ETH,
);
const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");

// const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
const usdtOutputTokenIndex = 2;
const metapoolMint1OutputTokenIndex = 3;

// const poolRemoveExactBurnIx = {removeExactBurn: {} };
// const poolSwapExactInputIx = {swapExactInput: {} };
// type TokenIdMapPoolIx = poolRemoveExactBurnIx | poolSwapExactInputIx;
// type TokenIdMapPoolIx2 = "removeExactBurn" | "swapExactInput";
// type PoolIx = {
//   readonly [key in TokenIdMapPoolIx2]?: {};
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
// let metapoolMint1TokenIdMap: TokenIdMap;
// let outputTokenIdMappings: ReadonlyMap<number, TokenIdMap>;

const propellerEngine = web3.Keypair.generate();
console.info(`propellerEngine: ${propellerEngine.publicKey.toBase58()}`);
// let propellerEngineSwimUsdAta: web3.PublicKey;

let switchboard: SwitchboardTestContext;
// let aggregatorKey: PublicKey;

describe("propeller", () => {
  beforeAll(async () => {
    console.info(`Setting up flagship pool`);
    await setupFlagshipPool();
    console.info(
      `Finished setting up flagship pool and relevant user token accounts`,
    );
    await seedFlagshipPool();
    console.info(`Finished seeding flagship pool`);

    console.info(`metapool initializeV2 `);
    await setupMetaPool();
    console.info(`Done setting up metapool & relevant user token accounts`);
    await seedMetaPool();
    console.info(`Done seeding metapool`);

    console.info(`initializing propeller`);
    await initializePropeller();
    console.info(`initialized propeller`);

    console.info(`creating token id maps`);
    await createTokenIdMaps();
    console.info(`created token id maps`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    propellerEngineSwimUsdAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer,
        swimUsdKeypair.publicKey,
      )
    ).address;

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

    console.info(`seeding wormhole custody`);
    await seedWormholeCustody();
    console.info(`finished seeing wormhole custody`);

    console.info(`setting up switchboard`);
    // If fails, fallback to looking for a local env file
    try {
      switchboard = await SwitchboardTestContext.loadFromEnv(provider);
      const aggregatorAccount = await switchboard.createStaticFeed(100);
      aggregatorKey = aggregatorAccount.publicKey;
      console.info("local env detected");
      return;
    } catch (error: any) {
      console.info(`Error: SBV2 Localnet - ${JSON.stringify(error.message)}`);
      throw new Error(
        `Failed to load localenv SwitchboardTestContext: ${JSON.stringify(
          error.message,
        )}`,
      );
    }
  }, 50000);

  it("processes the swim payload", async () => {
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

    const messageAccountInfo = await connection.getAccountInfo(messageAccount);
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
    expect(parsedTokenTransferFromMessage.tokenChain).toEqual(CHAIN_ID_SOLANA);
    expect(
      new web3.PublicKey(
        tryHexToNativeAssetString(
          parsedTokenTransferFromMessage.tokenAddress.toString("hex"),
          CHAIN_ID_SOLANA,
        ),
      ),
    ).toEqual(swimUsdKeypair.publicKey);
    expect(swimPayloadFromMessage.owner).toEqual(provider.publicKey.toBuffer());

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

    const propellerCompleteNativeWithPayload = propellerProgram.methods
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
        feeRecipient: propellerRedeemerEscrowAccount,
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
      .preInstructions([requestUnitsIx]);
    // .transaction();

    const propellerCompleteNativeWithPayloadTxn =
      await propellerCompleteNativeWithPayload.transaction();
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

    const pubkeys = await propellerCompleteNativeWithPayload.pubkeys();
    if (!pubkeys.propellerMessage) {
      throw new Error("PropellerMessage PDA not auto-derived");
    }
    const propellerMessage = pubkeys.propellerMessage;
    await getUserTokenAccounts(propellerMessage, propellerProgram.programId);

    // assert(propellerMessage);
    // .transaction();

    // const transferNativeTxnSig = await provider.sendAndConfirm(
    //   await propellerCompleteNativeWithPayloadTxn.transaction(),
    //   [payer],
    //   {
    //     skipPreflight: true,
    //   },
    // );
    //
    // // const transferNativeTxnSize = propellerCompleteNativeWithPayloadTxn.serialize().length;
    // // console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
    // await connection.confirmTransaction({
    //   signature: transferNativeTxnSig,
    //   ...(await connection.getLatestBlockhash()),
    // });
    //
    // // const tset = poolUsdcAtaAddr.toString();
    // const propellerRedeemerEscrowAccountAfter = (
    //   await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)
    // ).amount;
    // console.info(`
    //   propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore}
    //   propellerRedeemerEscrowAccountAfter: ${propellerRedeemerEscrowAccountAfter}
    // `);
    // expect(
    //   propellerRedeemerEscrowAccountAfter.gt(
    //     propellerRedeemerEscrowAccountBefore,
    //   ),
    // ).toEqual(true);

    // const userTransferAuthority = web3.Keypair.generate().publicKey;
    // const { userTokenAccount0, userTokenAccount1, userLpTokenAccount } =
    //   await getUserTokenAccounts(
    //     propellerMessage,
    //     propeller,
    //     propellerProgram.programId,
    //   );

    // const propellerCompleteToUserTxn = await propellerProgram.methods
    //   .processSwimPayload()
    //   .accounts({
    //     propeller,
    //     payer: user.publicKey,
    //     claim: claimAddressPubkey,
    //     message: messageAccount,
    //     // auto derived
    //     // propellerClaim:
    //     // can also be auto-derived
    //     propellerMessage,
    //     //autderived
    //     // redeemer: propellerRedeemer,
    //     redeemerEscrow: propellerRedeemerEscrowAccount.address,
    //     feeRecipient: userSwimUsdAtaAddr,
    //     aggregator: aggregatorKey,
    //     // auto-derived?
    //     // tokenIdMap:
    //     pool: flagshipPool,
    //     poolTokenAccount0: poolUsdcAtaAddr,
    //     poolTokenAccount1: poolUsdtAtaAddr,
    //     lpMint: flagshipPoolLpMint,
    //     governanceFee: flagshipPoolGovernanceFeeAddr,
    //     userTransferAuthority,
    //     userTokenAccount0,
    //     userTokenAccount1,
    //     userLpTokenAccount,
    //     tokenProgram: splToken.programId,
    //     memo: MEMO_PROGRAM_ID,
    //     twoPoolProgram: TWO_POOL_PROGRAM_ID,
    //     systemProgram: web3.SystemProgram.programId,
    //   })
    //   .rpc();
    // expect(propellerRedeemerEscrowAccountAfter).toBe(propellerRedeemerEscrowAccountBefore - transferNativeTxnSize);
  });

  it("simulates propellerEngine processing swim payload", async () => {
    await Promise.all([]);
    expect(true).toEqual(true);
  });
});

const getUserTokenAccounts = async (
  propellerMessage: web3.PublicKey,
  // propeller: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
) => {
  const propellerMessageData =
    await propellerProgram.account.propellerMessage.fetch(propellerMessage);

  const targetTokenId = propellerMessageData.swimPayload.targetTokenId;

  if (targetTokenId === 0) {
    // getting out swimUSD. is this an accepted route?
  }

  const owner = new web3.PublicKey(propellerMessageData.swimPayload.owner);
  const [tokenIdMap] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propeller.toBuffer(),
      new BN(targetTokenId).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
  const tokenIdMapData = await propellerProgram.account.tokenIdMap.fetch(
    tokenIdMap,
  );
  const poolKey = tokenIdMapData.pool;
  const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userTokenAccount0: await getAssociatedTokenAddress(
      poolData.tokenMintKeys[0],
      owner,
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userTokenAccount1: await getAssociatedTokenAddress(
      poolData.tokenMintKeys[1],
      owner,
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userLpTokenAccount: await getAssociatedTokenAddress(
      poolData.lpMintKey,
      owner,
    ),
  };
  // let userTokenAccount0: web3.PublicKey;
  // let userTokenAccount1: web3.PublicKey;
  // let userLpTokenAccount: web3.PublicKey;
  // for (let i = 0; i < poolData.tokenMintKeys.length; i++){
  //   const userTokenAccount = await getAssociatedTokenAddress(poolData.tokenMintKeys[i], owner);
  //   result[`userTokenAccount${i}`] = userTokenAccount;
  // }
  // for (const mint of poolData.tokenMintKeys) {
  //
  // }
  // // TODO: optimize this by only requiring the userToken matching the poolTokenIndex to actually be the owner's ATA
  // // const poolTokenIndex = tokenIdMapData.poolTokenIndex;
  // // const poolTokenMint = tokenIdMapData.poolTokenMint;
  //
  //
  // userTokenAccount0 = await getAssociatedTokenAddress(poolTokenMint, owner);
  // const t = {
  //   userTokenAccount0: await getAssociatedTokenAddress(pool.)
  // }
  // userTokenAccount1 =
  // const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
  // need propellerMessage.swimPayload.targetTokenId
  // if(targetTokenId === 0)
  // getTargetTokenMapping(target_token_id)
};

const setupFlagshipPool = async () => {
  ({
    poolPubkey: flagshipPool,
    poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
    governanceFeeAccount: flagshipPoolGovernanceFeeAddr,
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
      governanceFeeAccount: flagshipPoolGovernanceFeeAddr,
      tokenProgram: splToken.programId,
      associatedTokenProgram: splAssociatedToken.programId,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([swimUsdKeypair]);

  const pubkeys = await initFlagshipPoolTxn.pubkeys();

  console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
  if (!pubkeys.pool) {
    throw new Error("Pool Pubkey not auto derived");
  }
  const pool = pubkeys.pool;
  console.info(
    `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
  );

  expect(pool.toBase58()).toBe(flagshipPool.toBase58());
  const initFlagshipPoolTxnSig = await initFlagshipPoolTxn.rpc(
    rpcCommitmentConfig,
  );

  console.info(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

  const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
  console.info(
    `flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`,
  );

  marginalPricePool = flagshipPool;

  const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...poolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      swimUsdKeypair.publicKey.toBytes(),
      Buffer.from([flagshipPoolData.bump]),
    ],
    twoPoolProgram.programId,
  );
  expect(flagshipPool.toBase58()).toBe(calculatedSwimPoolPda.toBase58());

  console.info(`setting up user token accounts for flagship pool`);
  ({
    userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
    userLpTokenAta: userSwimUsdAtaAddr,
  } = await setupUserAssociatedTokenAccts(
    provider.connection,
    user.publicKey,
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
};

const seedFlagshipPool = async () => {
  const inputAmounts = [new BN(10_000_000_000_000), new BN(5_000_000_000_000)];
  const minimumMintAmount = new BN(0);
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
    .add(inputAmounts, minimumMintAmount, memo)
    .accounts({
      // propeller: propeller,
      poolTokenAccount0: poolUsdcAtaAddr,
      poolTokenAccount1: poolUsdtAtaAddr,
      lpMint: swimUsdKeypair.publicKey,
      governanceFee: flagshipPoolGovernanceFeeAddr,
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
};

const setupMetaPool = async () => {
  const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      metapoolLpMintKeypair.publicKey.toBytes(),
    ],
    twoPoolProgram.programId,
  );

  ({
    poolPubkey: metapool,
    poolTokenAccounts: [metapoolPoolTokenAta0, metapoolPoolTokenAta1],
    governanceFeeAccount: metapoolGovernanceFeeAta,
  } = await setupPoolPrereqs(
    twoPoolProgram,
    splToken,
    metapoolMintKeypairs,
    metapoolMintDecimals,
    [flagshipPool, metapoolMint1Authority.publicKey],
    // [metapoolMintKeypair1],
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
    throw new Error("Metapool address not auto-derived");
  }
  const derivedMetapool = initMetapoolTxnPubkeys.pool;
  console.info(
    `derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`,
  );
  expect(metapoolPda.toBase58()).toBe(derivedMetapool.toBase58());
  expect(derivedMetapool.toBase58()).toBe(metapool.toBase58());

  const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

  console.info(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

  const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
  console.info(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
  expect(metapoolBump).toBe(metapoolData.bump);

  const calculatedMetapoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      metapoolLpMintKeypair.publicKey.toBytes(),
      Buffer.from([metapoolData.bump]),
    ],
    twoPoolProgram.programId,
  );
  expect(metapool.toBase58()).toBe(calculatedMetapoolPda.toBase58());

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  userMetapoolTokenAccount0 = (
    await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      metapoolLpMintKeypair.publicKey,
      user.publicKey,
      false,
      commitment,
      rpcCommitmentConfig,
    )
  ).address;

  ({
    userPoolTokenAtas: [userMetapoolTokenAccount1],
    userLpTokenAta: userMetapoolLpTokenAccount,
  } = await setupUserAssociatedTokenAccts(
    provider.connection,
    user.publicKey,
    [metapoolMint1Keypair.publicKey],
    [metapoolMint1Authority],
    metapoolLpMintKeypair.publicKey,
    initialMintAmount,
    payer,
    commitment,
    rpcCommitmentConfig,
  ));
};

const seedMetaPool = async () => {
  const inputAmounts = [new BN(2_000_000_000_000), new BN(1_000_000_000_000)];
  const minimumMintAmount = new BN(0);
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
    .add(inputAmounts, minimumMintAmount, memo)
    .accounts({
      // propeller: propeller,
      poolTokenAccount0: poolUsdcAtaAddr,
      poolTokenAccount1: poolUsdtAtaAddr,
      lpMint: swimUsdKeypair.publicKey,
      governanceFee: flagshipPoolGovernanceFeeAddr,
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

  console.info(`
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);
};

const initializePropeller = async () => {
  const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
    propellerProgram.programId,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerRedeemerEscrowAddr = await getAssociatedTokenAddress(
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  const propellerAcct = await connection.getAccountInfo(propeller);
  if (!propellerAcct) {
    throw new Error("Propeller AccountInfo not found");
  }
  console.info(`propellerAcct.owner: ${propellerAcct.owner.toBase58()}`);

  const propellerData = await propellerProgram.account.propeller.fetch(
    propeller,
  );
  console.info(`propellerData: ${JSON.stringify(propellerData)}`);

  console.info(`propellerFee: ${propellerData.propellerFee.toString()}`);
  console.info(
    `gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`,
  );
  console.info(
    `propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`,
  );

  console.info(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.toBase58()}
		`);
};

const createTokenIdMaps = async () => {
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
  const metapoolMint1TokenIdMap = {
    pool: metapool,
    poolTokenIndex: 1,
    poolTokenMint: metapoolMint1Keypair.publicKey,
    poolIx: { swapExactInput: {} },
  };
  const outputTokenIdMapAddrEntries = await Promise.all(
    [
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
          pool: flagshipPool,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .signers([propellerAdmin]);

      const pubkeys = await createTokenIdMappingTxn.pubkeys();
      const tokenIdMapAddr = pubkeys.tokenIdMap;
      expect(tokenIdMapAddr).toBeTruthy();

      await createTokenIdMappingTxn.rpc();

      const fetchedTokenIdMap = await propellerProgram.account.tokenIdMap.fetch(
        tokenIdMapAddr,
      );
      expect(fetchedTokenIdMap.outputTokenIndex).toEqual(outputTokenIndex);
      expect(fetchedTokenIdMap.pool).toEqual(tokenIdMap.pool);
      expect(fetchedTokenIdMap.poolTokenIndex).toEqual(
        tokenIdMap.poolTokenIndex,
      );
      expect(fetchedTokenIdMap.poolTokenMint).toEqual(tokenIdMap.poolTokenMint);
      expect(fetchedTokenIdMap.poolIx).toEqual(tokenIdMap.poolIx);
      return { outputTokenIndex, tokenIdMapAddr };
    }),
  );
  const outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey> = new Map(
    outputTokenIdMapAddrEntries.map(({ outputTokenIndex, tokenIdMapAddr }) => {
      return [outputTokenIndex, tokenIdMapAddr];
    }),
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
};

const seedWormholeCustody = async () => {
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

  const transferAmount = userLpTokenBalanceBefore.div(new BN(2));
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
    .rpc();

  console.info(`transferNativeTxn(seedWormholeCustody): ${transferNativeTxn}`);
};
