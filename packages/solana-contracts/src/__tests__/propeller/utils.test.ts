import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryHexToNativeAssetString,
  tryNativeToHexString,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import type { Program } from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

import type { Propeller } from "../../artifacts/propeller";

import { swimPayloadVersion } from "./consts";
import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  formatParsedTokenTransferWithSwimPayloadVaa,
  parseSwimPayload,
  parseTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadSignedVaa,
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

// const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
// const usdtOutputTokenIndex = 2;
// const metapoolMint1OutputTokenIndex = 3;

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
// const splToken = Spl.token(provider);
// const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
setProvider(provider);
const mintDecimal = 6;

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
const swimUsdKeypair = web3.Keypair.generate();
const propellerProgram = workspace.Propeller as Program<Propeller>;

describe("utils tests", () => {
  it("should parse token transfer with payload", async () => {
    const memo = "e45794d6c5a2750b";
    const memoBuffer = Buffer.alloc(16);
    // Uint8Array.from()
    memoBuffer.write(memo);
    // const owner = tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA);
    // encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
    const propellerEnabled = true;
    const gasKickstart = false;
    const maxFee = new BN(1_000_000_000);
    const swimPayload = {
      version: swimPayloadVersion,
      owner: provider.publicKey.toBuffer(),
      // owner: owner.toBuffer(),
      propellerEnabled,
      gasKickstart,
      maxFee,
      targetTokenId: usdcOutputTokenIndex,
      memo: memoBuffer,
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
      async (tx) => {
        return provider.wallet.signTransaction(tx);
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
  });
  describe("encode & parse variable lengths of SwimPayload", () => {
    let memoId = 0;
    it("parses SwimPayload with all fields", () => {
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write((++memoId).toString().padStart(16, "0"));
      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
        propellerEnabled: false,
        gasKickstart: false,
        maxFee: new BN(100),
        targetTokenId: 1,
        memo: memoBuffer,
      };
      const encodedSwimPayload = encodeSwimPayload(swimPayload);
      const parsedSwimPayload = parseSwimPayload(encodedSwimPayload);
      console.info(`
        encodedSwimPayload: ${encodedSwimPayload.toString()}
        parsedSwimPayload: ${JSON.stringify(parsedSwimPayload, null, 2)}
      `);

      expect(parsedSwimPayload.version).toEqual(swimPayload.version);
      expect(parsedSwimPayload.owner).toEqual(swimPayload.owner);
      expect(parsedSwimPayload.propellerEnabled).toEqual(false);
      expect(parsedSwimPayload.gasKickstart).toEqual(false);
      console.info(`
      swimPayload.maxFee: ${swimPayload.maxFee.toString()}
      parsedSwimPayload.maxFee: ${parsedSwimPayload.maxFee.toString()}
      `);
      expect(parsedSwimPayload.maxFee.eq(swimPayload.maxFee)).toBeTruthy();
      expect(parsedSwimPayload.targetTokenId).toEqual(
        swimPayload.targetTokenId,
      );
      expect(parsedSwimPayload.memo).toEqual(swimPayload.memo);
    });
    it("encodes & parses SwimPayload with only version & owner", () => {
      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
      };
      const encodedSwimPayload = encodeSwimPayload(swimPayload);
      const parsedSwimPayload = parseSwimPayload(encodedSwimPayload);
      console.info(`
        encodedSwimPayload: ${encodedSwimPayload.toString()}
        parsedSwimPayload: ${JSON.stringify(parsedSwimPayload, null, 2)}
      `);

      expect(parsedSwimPayload.version).toEqual(swimPayload.version);
      expect(parsedSwimPayload.owner).toEqual(swimPayload.owner);
      expect(parsedSwimPayload.propellerEnabled).toBeUndefined();
      expect(parsedSwimPayload.gasKickstart).toBeUndefined();
      expect(parsedSwimPayload.maxFee).toBeUndefined();
      expect(parsedSwimPayload.targetTokenId).toBeUndefined();
      expect(parsedSwimPayload.memo).toBeUndefined();
    });
  });
});
