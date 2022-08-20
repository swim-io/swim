import type {Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {web3, Spl} from "@project-serum/anchor";
import type {Propeller} from "../../src/artifacts/propeller";
import type {TwoPool} from "../../src/artifacts/two_pool";
import {
  addToPoolIx, deserializeSwimPool, initalizeTwoPoolV2, MintInfo, SwimPoolState, TWO_POOL_PROGRAM_ID
} from "./pool-utils";
import {
  Account, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  assert, expect
} from "chai";
import {
  formatParsedVaa,
  ParsedVaa,
  parseVaa,
  signAndEncodeVaa,
  WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE,
} from "./wormholeUtils";
import * as byteify from "byteify";
import {
  ChainId,
  CHAIN_ID_ETH,
  createNonce,
  importCoreWasm,
  setDefaultWasm,
  tryHexToNativeAssetString,
  CHAIN_ID_SOLANA,
  toChainName,
  tryNativeToHexString,
  postVaaSolanaWithRetry,
  attestFromSolana,
  parseSequenceFromLogSolana,
  importTokenWasm,
  getForeignAssetEth,
  redeemOnSolana,
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
  chunks,
  parseTransferPayload,
  tryHexToNativeString,
  ixFromRust,
  tryNativeToUint8Array, getSignedVAAHash, getClaimAddressSolana, getEmitterAddressSolana, ChainName,
} from "@certusone/wormhole-sdk";
import {BigNumber} from "ethers";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeAttestMeta,
  encodeTokenTransfer,
  encodeTokenTransferWithPayload, formatParsedTokenTransferPostedMessage,
  formatParsedTokenTransferSignedVaa,
  getMintMetaPdas,
  ParsedTokenTransfer,
  ParsedTokenTransferPostedMessage,
  ParsedTokenTransferSignedVaa, parseTokenTransferPostedMessage,
  parseTokenTransferSignedVaa,
  toBigNumberHex,
} from "./tokenBridgeUtils";
import { parseUnits } from "ethers/lib/utils";
import {tryUint8ArrayToNative} from "@certusone/wormhole-sdk/lib/cjs/utils/array";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Secp256k1Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {SwitchboardTestContext} from "@switchboard-xyz/sbv2-utils";
import { setupPoolPrereqs, setupUserAssociatedTokenAccts } from "../twoPool/poolTestUtils";
import { getApproveAndRevokeIxs } from "../../src";
import { encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage, formatParsedTokenTransferWithSwimPayloadVaa,
  getPropellerPda,
  getPropellerRedeemerPda,
  getPropellerSenderPda,
  parseTokenTransferWithSwimPayloadPostedMessage, parseTokenTransferWithSwimPayloadSignedVaa } from "./propellerUtils";
// this just breaks everything for some reason...
// import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
const MEMO_PROGRAM_ID: PublicKey = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

// import {getAssociatedTokenAddress} from "@solana/spl-token/src/state";

// import {WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE} from "./wormhole_utils";

setDefaultWasm("node");

const envProvider = anchor.AnchorProvider.env();

const confirmedCommitment = {commitment: "confirmed" as web3.Finality};
const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true
};
const provider = new anchor.AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig
);
const connection = provider.connection;
const payer = (provider.wallet as NodeWallet).payer;
const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
anchor.setProvider(provider);

//eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const propellerProgram = anchor.workspace.Propeller as Program<Propeller>;
const twoPoolProgram = anchor.workspace.TwoPool as Program<TwoPool>;

const wormhole = WORMHOLE_CORE_BRIDGE;
const tokenBridge = WORMHOLE_TOKEN_BRIDGE;


let ethTokenBridgeSequence = 0n;


const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(ethTokenBridgeStr, CHAIN_ID_ETH);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridge = Buffer.from(
  ethTokenBridgeEthHexStr,
  "hex"
);


const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
const ethRoutingContractEthHexStr = tryNativeToHexString(ethRoutingContractStr, CHAIN_ID_ETH);
const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(ethRoutingContractStr, CHAIN_ID_ETH);
const ethRoutingContract = Buffer.from(
  ethRoutingContractEthHexStr,
  "hex"
);

const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  // units: 420690,
  units: 900000,
  additionalFee: 0,
});


let metapool: web3.PublicKey;
let metapoolData: SwimPoolState;
let metapoolAuth: web3.PublicKey;
let userMetapoolTokenAccount0: web3.PublicKey;
let userMetapoolTokenAccount1: web3.PublicKey;
let userMetapoolLpTokenAccount: web3.PublicKey;

let propeller: web3.PublicKey;
let propellerSender: web3.PublicKey;
let propellerRedeemer: web3.PublicKey;
let propellerRedeemerEscrowAccount: Account;
const propellerAdmin: web3.Keypair = web3.Keypair.generate();

const user = payer;
const initialMintAmount = 100_000_000_000_000;
// const usdcMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: user.publicKey,
// };
// const usdtMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: user.publicKey
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
let flagshipPoolGovernanceFeeAddr: web3.PublicKey;

let userUsdcAtaAddr: web3.PublicKey;
let userUsdtAtaAddr: web3.PublicKey;
let userSwimUsdAtaAddr: web3.PublicKey;
const ampFactor  = { value: new anchor.BN(300), decimals: 0 };
const lpFee =  { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey;
const flagshipPoolLpMint: web3.PublicKey = swimUsdKeypair.publicKey;
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
let metapoolPoolTokenAta0: web3.PublicKey;
let metapoolPoolTokenAta1: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

const gasKickstartAmount: anchor.BN = new anchor.BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: anchor.BN = new anchor.BN(0.25 * LAMPORTS_PER_SOL);
const propellerMinTransferAmount = new anchor.BN(5_000_000);
const propellerEthMinTransferAmount = new anchor.BN(10_000_000);
let marginalPricePool: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;

const evmTargetTokenId = 2;
const evmTargetTokenAddrEthHexStr = tryNativeToHexString("0x0000000000000000000000000000000000000003", CHAIN_ID_ETH)
const evmTargetTokenAddr = Buffer.from(
  evmTargetTokenAddrEthHexStr,
  "hex"
);

const evmOwnerEthHexStr = tryNativeToHexString("0x0000000000000000000000000000000000000004", CHAIN_ID_ETH);
const evmOwner = Buffer.from(
  evmOwnerEthHexStr,
  "hex"
);

const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
const usdtOutputTokenIndex = 2;
const metapoolMint1OutputTokenIndex = 3;
// const poolRemoveExactBurnIx = {removeExactBurn: {} };
// const poolSwapExactInputIx = {swapExactInput: {} };
// type TokenIdMapPoolIx = poolRemoveExactBurnIx | poolSwapExactInputIx;
type TokenIdMapPoolIx2 = 'removeExactBurn' | 'swapExactInput';
type PoolIx = {
  [key in TokenIdMapPoolIx2]?: {}
}
type TokenIdMap = {
  pool: web3.PublicKey;
  poolTokenIndex: number;
  poolTokenMint: web3.PublicKey;
  poolIx: PoolIx;
}
// type TokenIdMapping = {
//
// }
let usdcTokenIdMap: TokenIdMap;
let usdtTokenIdMap: TokenIdMap;
let metapoolMint1TokenIdMap: TokenIdMap;
let outputTokenIdMappings: Map<number, TokenIdMap>;

const propellerEngine = web3.Keypair.generate();
let propellerEngineSwimUsdAta: web3.PublicKey;


let switchboard: SwitchboardTestContext;
let aggregatorKey: PublicKey;

describe("propeller", () => {

  before("setup", async () => {
    console.log(`Setting up flagship pool`);
    await setupFlagshipPool();
    console.log(`Finished setting up flagship pool and relevant user token accounts`);
    await seedFlagshipPool();
    console.log(`Finished seeding flagship pool`);

    console.log(`metapool initializeV2 `);
    await setupMetaPool();
    console.log(`Done setting up metapool & relevant user token accounts`);
    await seedMetaPool();
    console.log(`Done seeding metapool`);


    console.log(`initializing propeller`);
    await initializePropeller();
    console.log(`initialized propeller`);

    console.log(`creating token id maps`);
    await createTokenIdMaps();
    console.log(`created token id maps`);

    propellerEngineSwimUsdAta = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      swimUsdKeypair.publicKey,
    )).address;


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
      return await web3.PublicKey.findProgramAddress([tokenBridgeMint.toBytes()], tokenBridge);
    })();

    [wormholeConfig] = await web3.PublicKey.findProgramAddress([Buffer.from("Bridge")], wormhole);
    [wormholeFeeCollector] = await web3.PublicKey.findProgramAddress([Buffer.from("fee_collector")], wormhole);
    // wh functions return in a hex string format
    // wormholeEmitter = new web3.PublicKey(
    //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
    //   );
    [wormholeEmitter] = await web3.PublicKey.findProgramAddress([Buffer.from("emitter")], tokenBridge);
    [wormholeSequence] = await web3.PublicKey.findProgramAddress([Buffer.from("Sequence"), wormholeEmitter.toBytes()], wormhole);

    [authoritySigner] = await web3.PublicKey.findProgramAddress([Buffer.from("authority_signer")], tokenBridge);
    [tokenBridgeConfig] = await web3.PublicKey.findProgramAddress([Buffer.from("config")], tokenBridge);
    [custodySigner] = await web3.PublicKey.findProgramAddress([Buffer.from("custody_signer")], tokenBridge);

    console.log(`
            custodyOrWrappedMeta: ${custody.toString()}
            wormholeConfig: ${wormholeConfig.toString()}
            wormholeFeeCollector: ${wormholeFeeCollector.toString()}
            wormholeEmitter: ${wormholeEmitter.toString()}
            wormholeSequence: ${wormholeSequence.toString()}
            authoritySigner: ${authoritySigner.toString()}
            tokenBridgeConfig: ${tokenBridgeConfig.toString()}
            custodySigner: ${custodySigner.toString()}
        `)

    console.log(`seeding wormhole custody`);
    await seedWormholeCustody();
    console.log(`finished seeing wormhole custody`);



    console.log(`setting up switchboard`);
    // If fails, fallback to looking for a local env file
    try {
      switchboard = await SwitchboardTestContext.loadFromEnv(provider);
      const aggregatorAccount = await switchboard.createStaticFeed(100);
      aggregatorKey = aggregatorAccount.publicKey ?? PublicKey.default;
      console.log("local env detected");
      return;
    } catch (error: any) {
      console.log(`Error: SBV2 Localnet - ${error.message}`);
      throw new Error(`Failed to load localenv SwitchboardTestContext: ${error.message}`);
    }


  });


  it("processes the swim payload", async () => {
    const memo = "e45794d6c5a2750b";
    const memoBuffer = Buffer.alloc(16);
    memoBuffer.write(memo);
    //`to` in tokenTransfer on js client side is encoded like this
    // recipient is web3.PublicKey
    //hexToUint8Array(
    //       nativeToHexString(recipient.toString(), CHAIN_ID_SOLANA) || ""
    //)
    const swimPayload = {
      version: 0,
      // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
      // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
      // is this how the owner will be encoded if coming from eth?
      owner: provider.publicKey.toBuffer(),
      //for targetTokenId, how do i know which pool to go to for the token?
      // e.g. 0 probably reserved for swimUSD
      // 1 usdc
      // 2 usdt
      // 3 some other solana stablecoin
      targetTokenId: usdcOutputTokenIndex,
      // minOutputAmount: 0n,
      memo: memoBuffer,
      propellerEnabled: true,
      minThreshold: 0n,
      gasKickstart: false,
    };
    //1_000_000_000_000
    let amount = parseUnits("100000", mintDecimal);
    // console.log(`amount: ${amount.toString()}`);
    /**
     * this is encoding a token transfer from eth routing contract
     * with a swimUSD token address that originated on solana
     * the same as initializing a `TransferWrappedWithPayload` from eth
     */
    const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      0,
      0,
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
      )
    );
    const propellerRedeemerEscrowAccountBefore = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;

    // const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferWithPayloadSignedVaa);
    // console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);

    // const parsedVaa = await parseVaa(tokenTransferWithPayloadSignedVaa);
    // const formattedParsedVaa = formatParsedVaa(parsedVaa);
    // console.log(`
    //   formattedParsedVaa: ${JSON.stringify(formattedParsedVaa, null, 2)}
    // `)
    const parsedTokenTransferWithSwimPayloadVaa = await parseTokenTransferWithSwimPayloadSignedVaa(tokenTransferWithPayloadSignedVaa);
    console.log(`
        parsedTokenTransferWithSwimPayloadVaa: ${JSON.stringify(formatParsedTokenTransferWithSwimPayloadVaa(parsedTokenTransferWithSwimPayloadVaa), null, 2)}
      `)

    const {
      tokenTransferVaa: {
        core: parsedVaa,
        tokenTransfer: parsedTokenTransferFromVaa
      },
      swimPayload: swimPayloadFromVaa
    } = parsedTokenTransferWithSwimPayloadVaa;

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
    // 	console.log(`txnSig: ${txnSig} had ${chunk.length} instructions`);
    // 	verifyTxnSigs.push(txnSig);
    // }));
    // console.log(`verifyTxnSigs: ${JSON.stringify(verifyTxnSigs)}`);
    // await Promise.all(verifyTxnSigs.map(async (txnSig) => {
    // 	const info = await connection.getTransaction(txnSig, confirmedCommitment);
    // 	if (!info) {
    // 		throw new Error(
    // 			`An error occurred while fetching the transaction info for ${txnSig}`
    // 		);
    // 	}
    // 	// get the sequence from the logs (needed to fetch the vaa)
    // 	const logs = info.meta?.logMessages;
    // 	console.log(`${txnSig} logs: ${JSON.stringify(logs)}`);
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
    // console.log(`postVaaTxnSig: ${postVaaTxnSig}`);
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
      async (tx) => {
        tx.partialSign(payer);
        return tx;
      },
      WORMHOLE_CORE_BRIDGE.toBase58(),
      payer.publicKey.toBase58(),
      tokenTransferWithPayloadSignedVaa,
      10
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
      WORMHOLE_CORE_BRIDGE
    );

    // console.log(`
    // 	postVaaIxMessageAcct: ${postVaaIxMessageAcct.toBase58()}
    // 	messageAccount: ${messageAccount.toBase58()}
    // `)

    const messageAccountInfo = (await connection.getAccountInfo(messageAccount))!;
    // console.log(`messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`);
    /*
      vaa: 118,97,97
      msg: 109,115,103
      msu: 109,115,117
      let discriminators = ["vaa", "msg", "msu"];
      let txtEncoder = new TextEncoder();
      discriminators.forEach(discriminator => { console.log(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
     */
    // program.methods.Message.deserialize(messageAccountInfo.data);




    // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
    // const {
    // 	payload: postedMessagePayload2,
    // } = parsed2;
    // console.log(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
    // const {
    //   payload: postedVaaPayload,
    //   ...postedMessage
    // }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
    // console.log(`postedMessage:\n${JSON.stringify(postedMessage)}`);
    // console.log(`postedMessagePayload:\n${JSON.stringify(postedVaaPayload)}`);
    // const {
    //   payload: postedSwimPayload
    // } = postedVaaPayload;
    //
    // console.log(`postedSwimPayload:\n${JSON.stringify(postedSwimPayload)}`);
    const parsedTokenTransferWithSwimPayloadPostedMessage  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
    console.log(`
        parsedTokenTransferWithSwimPayloadPostedMessage:
          ${JSON.stringify(formatParsedTokenTransferWithSwimPayloadPostedMessage(parsedTokenTransferWithSwimPayloadPostedMessage), null, 2)}
    `);
    const {
      tokenTransferMessage: {
        core: parsedMessage,
        tokenTransfer: parsedTokenTransferFromMessage
      },
      swimPayload: swimPayloadFromMessage
    } = parsedTokenTransferWithSwimPayloadPostedMessage;

    //   const messsageAccountInfo = await connection.getAccountInfo(messageAccount);
    //   const parsedTokenTransferSignedVaaFromAccount = await parseTokenTransferWithSwimPayloadPostedMessage(
    //     messsageAccountInfo!.data
    //   );
    //
    //   console.log(`parsedTokenTransferSignedVaaFromAccount:\n
    // 	${JSON.stringify(parsedTokenTransferSignedVaaFromAccount, null, 2)}
    // `);
    //   const emitterAddrUint8Arr = tryNativeToUint8Array(
    //     parsedTokenTransferSignedVaaFromAccount.emitter_address2,
    //     parsedTokenTransferSignedVaaFromAccount.emitter_chain
    //   );
    //   console.log(`
    // 	emitter_address2Pub: ${new web3.PublicKey(emitterAddrUint8Arr).toBase58()}
    // `);
    const [endpointAccount] = await deriveEndpointPda(
      parsedVaa.emitterChain,
      parsedVaa.emitterAddress,
      // Buffer.from(new web3.PublicKey(parsedTokenTransferVaa.emitter_address).toBase58()),
      WORMHOLE_TOKEN_BRIDGE
    );
    console.log(`endpointAccount: ${endpointAccount.toBase58()}`);
    const claimAddressPubkey = await getClaimAddressSolana(
      WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa);



    const propellerCompleteNativeWithPayloadTxn = await propellerProgram
      .methods
      .completeNativeWithPayload()
      .accounts({
        propeller,
        payer: payer.publicKey,
        tokenBridgeConfig,
        // userTokenBridgeAccount: userLpTokenAccount.address,
        message: messageAccount,
        claim: claimAddressPubkey,
        endpoint: endpointAccount,
        to: propellerRedeemerEscrowAccount.address,
        redeemer: propellerRedeemer,
        // the feeRecipient doesn't really matter for this call if we don't call any other ixs
        feeRecipient: propellerRedeemerEscrowAccount.address,
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
      .preInstructions([
        requestUnitsIx,
      ]);

    const pubkeys = await propellerCompleteNativeWithPayloadTxn.pubkeys();
    const propellerMessage = pubkeys.propellerMessage;
    assert(propellerMessage);
    // .transaction();

    const transferNativeTxnSig = await provider.sendAndConfirm(
      await propellerCompleteNativeWithPayloadTxn.transaction(),
      [payer],
      {
        skipPreflight: true,
      }
    );

    // const transferNativeTxnSize = propellerCompleteNativeWithPayloadTxn.serialize().length;
    // console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
    await connection.confirmTransaction({
      signature: transferNativeTxnSig,
      ...(await connection.getLatestBlockhash())
    });

    // const tset = poolUsdcAtaAddr.toString();
    const propellerRedeemerEscrowAccountAfter = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;
    console.log(`
      propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore}
      propellerRedeemerEscrowAccountAfter: ${propellerRedeemerEscrowAccountAfter}
    `);
    assert.isTrue(propellerRedeemerEscrowAccountAfter.gt(propellerRedeemerEscrowAccountBefore));

    const userTransferAuthority = web3.Keypair.generate().publicKey;
    const {
      userTokenAccount0,
      userTokenAccount1,
      userLpTokenAccount
    } = await getUserTokenAccounts(propellerMessage, propeller, propellerProgram.programId);

    const propellerCompleteToUserTxn = await propellerProgram
      .methods
      .processSwimPayload()
      .accounts({
        propeller,
        payer: user.publicKey,
        claim: claimAddressPubkey,
        message: messageAccount,
        // auto derived
        // propellerClaim:
        // can also be auto-derived
        propellerMessage,
        //autderived
        // redeemer: propellerRedeemer,
        redeemerEscrow: propellerRedeemerEscrowAccount.address,
        feeRecipient: userSwimUsdAtaAddr,
        aggregator: aggregatorKey,
        // auto-derived?
        // tokenIdMap:
        pool: flagshipPool,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        lpMint: flagshipPoolLpMint,
        governanceFee: flagshipPoolGovernanceFeeAddr,
        userTransferAuthority,
        userTokenAccount0,
        userTokenAccount1,
        userLpTokenAccount,
        tokenProgram: splToken.programId,
        memo: MEMO_PROGRAM_ID,
        twoPoolProgram: TWO_POOL_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      }).rpc();
    expect(propellerRedeemerEscrowAccountAfter).to.equal(propellerRedeemerEscrowAccountBefore - transferNativeTxnSize);
  });

  it("simulates propellerEngine processing swim payload", async () => {

  });


  //TODO: this is so ugly. if someone knows a better way to check nested undefined please fix/let me know.
  async function checkTxnLogsForMemo(
    txSig: string,
    memoString: string
  ) {
    console.log(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {commitment: "confirmed"});
    assert(txnInfo);
    // expect(txnInfo).to.exist;
    // console.log(`txnInfo: ${JSON.stringify(txnInfo, null, 2)}`);
    // expect(txnInfo.meta).to.exist;
    assert(txnInfo.meta)
    const txnLogs = txnInfo!.meta.logMessages!;
    assert(txnLogs);
    // expect(txnLogs).to.exist;
    const memoLog = txnLogs.find( log => log.startsWith("Program log: Memo"));
    // expect(memoLog).to.exist;
    assert(memoLog);

    expect(memoLog.includes(memoString)).to.be.true;
  }

});

const getUserTokenAccounts = async (
  propellerMessage: web3.PublicKey,
  propeller: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
) => {
  const propellerMessageData = await propellerProgram.account.propellerMessage.fetch(propellerMessage);

  const targetTokenId = propellerMessageData.swimPayload.targetTokenId;

  if (targetTokenId === 0) {
    // getting out swimUSD. is this an accepted route?
  }

  const owner = new web3.PublicKey(propellerMessageData.swimPayload.owner);
  const [tokenIdMap, tokenIdMapBump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propeller.toBuffer(),
      new anchor.BN(targetTokenId).toArrayLike(Buffer, "le", 2)
    ],
    propellerProgramId
  );
  const tokenIdMapData = await propellerProgram.account.tokenIdMap.fetch(tokenIdMap);
  const poolKey = tokenIdMapData.pool;
  const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
  return {
    userTokenAccount0: await getAssociatedTokenAddress(poolData.tokenMintKeys[0], owner),
    userTokenAccount1: await getAssociatedTokenAddress(poolData.tokenMintKeys[0], owner),
    userLpTokenAccount: await getAssociatedTokenAddress(poolData.lpMintKey, owner),
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

}

const setupFlagshipPool = async() => {
  ({
    poolPubkey: flagshipPool,
    poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
    governanceFeeAccount: flagshipPoolGovernanceFeeAddr,
  } = await setupPoolPrereqs(
    twoPoolProgram,
    splToken,
    poolMintKeypairs,
    poolMintDecimals,
    poolMintAuthorities.map(k => k.publicKey),
    swimUsdKeypair.publicKey,
    governanceKeypair.publicKey,
  ));
  const initFlagshipPoolTxn = await twoPoolProgram
    .methods
    // .initialize(params)
    .initialize(
      ampFactor,
      lpFee,
      governanceFee,
    )
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
  console.log(`pubkeys: ${JSON.stringify(pubkeys)}`);
  const pool = pubkeys.pool!;
  console.log(`poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`);

  expect(pool.toBase58()).to.equal(flagshipPool.toBase58());
  const initFlagshipPoolTxnSig = await initFlagshipPoolTxn.rpc(rpcCommitmentConfig);

  console.log(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

  const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
  console.log(`flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`);

  marginalPricePool = flagshipPool;

  const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...poolMintKeypairs.map(
        (keypair) => keypair.publicKey.toBytes()
      ),
      swimUsdKeypair.publicKey.toBytes(),
      Buffer.from([flagshipPoolData.bump]),
    ],
    twoPoolProgram.programId
  );
  expect(flagshipPool.toBase58()).to.equal(calculatedSwimPoolPda.toBase58());

  console.log(`setting up user token accounts for flagship pool`);
  ({
    userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
    userLpTokenAta: userSwimUsdAtaAddr
  }  = await setupUserAssociatedTokenAccts(
    provider.connection,
    user.publicKey,
    poolMintKeypairs.map(kp => kp.publicKey),
    poolMintAuthorities,
    swimUsdKeypair.publicKey,
    initialMintAmount,
    payer,
    commitment,
    rpcCommitmentConfig
  ));

  console.log(`done setting up flagship pool and relevant user token accounts`);
  console.log(`
      flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
      user: {
        userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
        userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
        userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
      }
    `);
}

const seedFlagshipPool = async() => {
  const inputAmounts = [new anchor.BN(10_000_000_000_000), new anchor.BN(5_000_000_000_000)];
  const minimumMintAmount = new anchor.BN(0);
  const addParams = {
    inputAmounts,
    minimumMintAmount,
  }
  let userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    [userUsdcAtaAddr, userUsdtAtaAddr],
    inputAmounts,
    userTransferAuthority.publicKey,
    payer
  )
  const memoString = "propeller add";
  const memo = Buffer.from(memoString, "utf-8");
  const addTxn = await propellerProgram
    .methods
    .add(
      inputAmounts,
      minimumMintAmount,
      memo,
    )
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
    .preInstructions(approveIxs)
    .postInstructions(revokeIxs)
    .signers([userTransferAuthority]);
  // .rpc(rpcCommitmentConfig);

  const addTxnPubkeys = await addTxn.pubkeys();
  console.log(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

  const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

  console.log(`addTxSig: ${addTxnSig}`);
}



const setupMetaPool = async() => {
  const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map(
        (keypair) => keypair.publicKey.toBytes()
      ),
      metapoolLpMintKeypair.publicKey.toBytes(),
    ],
    twoPoolProgram.programId
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


  const initMetapoolTxn = await twoPoolProgram
    .methods
    // .initialize(params)
    .initialize(
      ampFactor,
      lpFee,
      governanceFee,
    )
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
    .signers([metapoolLpMintKeypair])
  // .rpc({skipPreflight: true});
  // console.log(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);

  const initMetapoolTxnPubkeys = (await initMetapoolTxn.pubkeys());
  console.log(`initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`);


  const derivedMetapool = initMetapoolTxnPubkeys.pool!;
  console.log(`derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`);
  expect(metapoolPda.toBase58()).to.equal(derivedMetapool.toBase58());
  expect(derivedMetapool.toBase58()).to.equal(metapool.toBase58());


  const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

  console.log(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

  const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
  console.log(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
  expect(metapoolBump).to.equal(metapoolData.bump);


  const calculatedMetapoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map(
        (keypair) => keypair.publicKey.toBytes()
      ),
      metapoolLpMintKeypair.publicKey.toBytes(),
      Buffer.from([metapoolData.bump]),
    ],
    twoPoolProgram.programId
  );
  expect(metapool.toBase58()).to.equal(calculatedMetapoolPda.toBase58());

  userMetapoolTokenAccount0 = (await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    metapoolLpMintKeypair.publicKey,
    user.publicKey,
    false,
    commitment,
    rpcCommitmentConfig
  )).address;

  ({
    userPoolTokenAtas: [userMetapoolTokenAccount1],
    userLpTokenAta: userMetapoolLpTokenAccount
  }  = await setupUserAssociatedTokenAccts(
    provider.connection,
    user.publicKey,
    [metapoolMint1Keypair.publicKey],
    [metapoolMint1Authority],
    metapoolLpMintKeypair.publicKey,
    initialMintAmount,
    payer,
    commitment,
    rpcCommitmentConfig
  ));
}

const seedMetaPool = async() => {
  const inputAmounts = [new anchor.BN(2_000_000_000_000), new anchor.BN(1_000_000_000_000)];
  const minimumMintAmount = new anchor.BN(0);
  const addParams = {
    inputAmounts,
    minimumMintAmount,
  }
  let userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    [userUsdcAtaAddr, userUsdtAtaAddr],
    inputAmounts,
    userTransferAuthority.publicKey,
    payer
  )
  const memoString = "propeller add";
  const memo = Buffer.from(memoString, "utf-8");
  const addTxn = await propellerProgram
    .methods
    .add(
      inputAmounts,
      minimumMintAmount,
      memo,
    )
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
    .preInstructions(approveIxs)
    .postInstructions(revokeIxs)
    .signers([userTransferAuthority]);
  // .rpc(rpcCommitmentConfig);

  const addTxnPubkeys = await addTxn.pubkeys();
  console.log(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

  const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

  console.log(`addTxSig: ${addTxnSig}`);

  console.log(`
      metapool: ${JSON.stringify(metapoolData, null, 2)}
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);
}

const initializePropeller = async() => {
  const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(propellerProgram.programId);
  const propellerRedeemerEscrowAddr = await getAssociatedTokenAddress(
    tokenBridgeMint,
    expectedPropellerRedeemerAddr,
    true
  );
  const initializeParams =  {
    gasKickstartAmount,
    propellerFee,
    propellerMinTransferAmount,
    propellerEthMinTransferAmount,
    marginalPricePool,
    marginalPricePoolTokenIndex,
    marginalPricePoolTokenMint,
    evmRoutingContractAddress: ethRoutingContract,
    // evmRoutingContractAddress: ethRoutingContractEthUint8Arr
  }
  let tx = propellerProgram
    .methods
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

  let pubkeys = await tx.pubkeys()
  console.log(`pubkeys: ${JSON.stringify(pubkeys, null, 2)}`);
  if (pubkeys.propeller) {
    propeller = pubkeys.propeller;
  } else {
    assert.ok(false)
  }
  console.log(`propeller: ${propeller.toBase58()}`);
  if (pubkeys.propellerSender) {
    propellerSender = pubkeys.propellerSender;
  } else {
    assert.ok(false);
  }

  if (pubkeys.propellerRedeemer) {
    propellerRedeemer = pubkeys.propellerRedeemer;
  } else {
    assert.ok(false);
  }
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

  const txSig = await tx.rpc({skipPreflight: true});
  await connection.confirmTransaction({
    signature: txSig,
    ...(await connection.getLatestBlockhash())
  });

  propellerRedeemerEscrowAccount = await getAccount(connection, propellerRedeemerEscrowAddr);

  // propellerRedeemerEscrowAccount = await getAccount(connection,propellerRedeemerEscrowAddr);
  // .then((address) => getAccount(connection, address));

  const expectedPropellerAddr = await getPropellerPda(tokenBridgeMint, propellerProgram.programId);
  expect(expectedPropellerAddr).to.deep.equal(propeller);

  const expectedPropellerSenderAddr = await getPropellerSenderPda(propellerProgram.programId);
  expect(propellerSender).to.deep.equal(expectedPropellerSenderAddr);

  expect(propellerRedeemer).to.deep.equal(expectedPropellerRedeemerAddr);

  const propellerAcct = await connection.getAccountInfo(propeller);
  console.log(`propellerAcct.owner: ${propellerAcct!.owner.toBase58()}`);



  const propellerData = await propellerProgram.account.propeller.fetch(propeller);
  console.log(`propellerData: ${JSON.stringify(propellerData)}`);
  expect(propellerData.admin).to.deep.equal(propellerAdmin.publicKey);
  expect(propellerData.tokenBridgeMint).to.deep.equal(tokenBridgeMint);

  console.log(`propellerFee: ${propellerData.propellerFee.toString()}`);
  console.log(`gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`);
  console.log(`propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`);
  assert.isTrue(propellerData.propellerFee.eq(propellerFee));
  assert.isTrue(propellerData.gasKickstartAmount.eq(gasKickstartAmount));
  assert.isTrue(propellerData.propellerMinTransferAmount.eq(propellerMinTransferAmount));
  console.log(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.address.toBase58()}
		`);
}

const createTokenIdMaps = async() => {
  usdcTokenIdMap = {
    pool: flagshipPool,
    poolTokenIndex: 0,
    poolTokenMint: usdcKeypair.publicKey,
    poolIx: { removeExactBurn: {} },
  };
  usdtTokenIdMap = {
    pool: flagshipPool,
    poolTokenIndex: 1,
    poolTokenMint: usdcKeypair.publicKey,
    poolIx: { removeExactBurn: {} },
  };
  metapoolMint1TokenIdMap = {
    pool: metapool,
    poolTokenIndex: 1,
    poolTokenMint: metapoolMint1Keypair.publicKey,
    poolIx: { swapExactInput: {} }
  };
  outputTokenIdMappings = new Map(
    [
      [usdcOutputTokenIndex, usdcTokenIdMap],
      [usdtOutputTokenIndex, usdtTokenIdMap],
      [metapoolMint1OutputTokenIndex, metapoolMint1TokenIdMap],
    ]
  );
  const outputTokenIdMappingAddrs: Map<number, web3.PublicKey> = new Map();

  for (const [outputTokenIndex, tokenIdMap] of outputTokenIdMappings.entries()) {
    let createTokenIdMappingTxn = propellerProgram
      .methods
      .createTokenIdMap(
        outputTokenIndex,
        tokenIdMap.pool,
        tokenIdMap.poolTokenIndex,
        tokenIdMap.poolTokenMint,
        tokenIdMap.poolIx
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

    let pubkeys = await createTokenIdMappingTxn.pubkeys();
    const tokenIdMapAddr = pubkeys.tokenIdMap;
    assert(tokenIdMapAddr);
    outputTokenIdMappingAddrs.set(outputTokenIndex, tokenIdMapAddr);

    await createTokenIdMappingTxn.rpc();

    const fetchedTokenIdMap = await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr);
    expect(fetchedTokenIdMap.outputTokenIndex).to.deep.equal(outputTokenIndex);
    expect(fetchedTokenIdMap.pool).to.deep.equal(tokenIdMap.pool);
    expect(fetchedTokenIdMap.poolTokenIndex).to.equal(tokenIdMap.poolTokenIndex);
    expect(fetchedTokenIdMap.poolTokenMint).to.deep.equal(tokenIdMap.poolTokenMint);
    expect(fetchedTokenIdMap.poolIx).to.deep.equal(tokenIdMap.poolIx);
  }
  for (const [outputTokenIndex, tokenIdMapAddr] of outputTokenIdMappingAddrs.entries()) {
    console.log(`
        outputTokenIndex: ${outputTokenIndex}
        tokenIdMapAddr: ${tokenIdMapAddr.toBase58()}
        tokenIdMap: ${JSON.stringify(await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr))}
      `)
  }
}

const seedWormholeCustody = async() => {
  const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
    units: 900000,
    additionalFee: 0,
  });


  const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  // console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
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
  // console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
  // await connection.confirmTransaction({
  //   signature: addLiqTxnSig,
  //   ...(await connection.getLatestBlockhash())
  // });
  // const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  // console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
  // const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);


  const transferAmount = userLpTokenBalanceBefore.div(new anchor.BN(2));
  const nonce = createNonce().readUInt32LE(0);
  const payload = Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
    // 190,63,68,
    // 1242
    // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
    // 1275
    // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  ]);
  const memo = "e45794d6c5a2750a";
  const memoBuffer = Buffer.alloc(16);
  memoBuffer.write(memo);
  const wormholeMessage = web3.Keypair.generate();
  const gasKickstart = false;
  const propellerEnabled = true;
  const transferNativeTxn = await propellerProgram
    .methods
    .transferNativeWithPayload(
      nonce,
      CHAIN_ID_ETH,
      transferAmount,
      evmTargetTokenId,
      // evmTargetTokenAddr,
      evmOwner,
      gasKickstart,
      propellerEnabled,
      memoBuffer
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
      memo: MEMO_PROGRAM_ID
    })
    .preInstructions([
      requestUnitsIx,
    ])
    .rpc();

  console.log(`transferNativeTxn(seedWormholeCustody): ${transferNativeTxn}`);
}

type PoolUserBalances = {
  poolTokenBalances: Array<anchor.BN>,
  userTokenBalances: Array<anchor.BN>,
  governanceFeeBalance: anchor.BN,
  userLpTokenBalance: anchor.BN,
  previousDepth: anchor.BN,
}
async function getFlagshipTokenAccountBalances(): Promise<PoolUserBalances> {
  const poolUsdcAtaBalance = (await splToken.account.token.fetch(poolUsdcAtaAddr)).amount;
  const poolUsdtAtaBalance = (await splToken.account.token.fetch(poolUsdtAtaAddr)).amount;
  const governanceFeeBalance = (await splToken.account.token.fetch(flagshipPoolGovernanceFeeAddr)).amount;
  const userUsdcAtaBalance = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
  const userUsdtAtaBalance = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
  const userLpTokenBalance = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  const previousDepth = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
  return {
    poolTokenBalances: [poolUsdcAtaBalance, poolUsdtAtaBalance],
    governanceFeeBalance,
    userTokenBalances: [userUsdcAtaBalance, userUsdtAtaBalance],
    userLpTokenBalance,
    previousDepth
  }
}

function printBeforeAndAfterPoolUserBalances(poolUserBalances: Array<PoolUserBalances>) {
  const {
    poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
    governanceFeeBalance: governanceFeeBalanceBefore,
    userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
    userLpTokenBalance: userLpTokenBalanceBefore,
    previousDepth: previousDepthBefore
  } = poolUserBalances[0];
  const {
    poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
    governanceFeeBalance: governanceFeeBalanceAfter,
    userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
    userLpTokenBalance: userLpTokenBalanceAfter,
    previousDepth: previousDepthAfter
  } =  poolUserBalances[1];
  console.log(`
    poolUsdcAtaBalance:
      before: ${poolUsdcAtaBalanceBefore.toString()},
      after: ${poolUsdcAtaBalanceAfter.toString()}
    poolUsdtAtaBalance:
      before: ${poolUsdtAtaBalanceBefore.toString()},
      after: ${poolUsdtAtaBalanceAfter.toString()}
    governanceFeeBalance:
      before: ${governanceFeeBalanceBefore.toString()},
      after: ${governanceFeeBalanceAfter.toString()}
    userUsdcAtaBalance:
      before: ${userUsdcAtaBalanceBefore.toString()},
      after: ${userUsdcAtaBalanceAfter.toString()}
    userUsdtAtaBalance:
      before: ${userUsdtAtaBalanceBefore.toString()},
      after: ${userUsdtAtaBalanceAfter.toString()}
    userLpTokenBalance:
      before: ${userLpTokenBalanceBefore.toString()},
      after: ${userLpTokenBalanceAfter.toString()}
    previousDepth:
      before: ${previousDepthBefore.toString()},
      after: ${previousDepthAfter.toString()}
  `);
}
