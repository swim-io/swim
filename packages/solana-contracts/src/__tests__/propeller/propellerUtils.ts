import type { ChainId, ChainName } from "@certusone/wormhole-sdk";
import { tryUint8ArrayToNative } from "@certusone/wormhole-sdk";
import { BN, web3 } from "@project-serum/anchor";
import { BigNumber } from "ethers";

import type {
  ParsedTokenTransferPostedMessage,
  ParsedTokenTransferSignedVaa,
} from "./tokenBridgeUtils";
import {
  formatParsedTokenTransferPostedMessage,
  formatParsedTokenTransferSignedVaa,
  parseTokenTransferPostedMessage,
  parseTokenTransferSignedVaa,
} from "./tokenBridgeUtils";

export async function getPropellerPda(
  mint: web3.PublicKey,
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress(
      [Buffer.from("propeller"), mint.toBytes()],
      programId,
    )
  )[0];
}

export async function getPropellerRedeemerPda(
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress(
      [Buffer.from("redeemer")],
      programId,
    )
  )[0];
}

export async function getPropellerSenderPda(
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress([Buffer.from("sender")], programId)
  )[0];
}
//
// async function addToPool(
// 	provider: anchor.AnchorProvider,
// 	pool: web3.PublicKey,
// 	poolState: SwimPoolState,
// 	userTokenAccounts: web3.PublicKey[],
// 	userLpTokenAccount: web3.PublicKey,
// 	inputAmounts: anchor.BN[],
// 	minimumMintAmount: anchor.BN,
// 	tokenAccountOwner: web3.Keypair,
// 	delegate: web3.PublicKey,
// ): Promise<string> {
// 	// let userMetapoolTokenAccountAmounts = await Promise.all(
// 	//     userMetapoolTokenAccounts.map(async (account) => {
// 	//     return (await splToken.account.token.fetch(account)).amount;
// 	// }));
// 	// console.log(`userMetapoolTokenAccountAmounts: ${userMetapoolTokenAccountAmounts}`)
// 	// let userMetapoolTokenAccounts0Amount = await splToken.account.token.fetch(userMetapoolTokenAccounts[0]);
// 	// let inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
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
// 		anchor.BN.max(inputAmounts[0]!, inputAmounts[1]!),
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
// 	console.log(`minted to user_token_account: ${tokenAccount.address.toBase58()}`);
// 	return tokenAccount
// }

// const parseTokenTransferWithSwimPayloadPostedMessage = async (arr: Buffer) => {
// 	const {parse_posted_message} = await importCoreWasm();
// 	const postedMessage = parse_posted_message(arr);
// 	const tokenTransfer = parseTransferWithPayload(Buffer.from(postedMessage.payload));
//   // console.log(`swimPayloadRawBufferStr: ${tokenTransfer.payload.toString()}`);
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
export interface ParsedSwimPayload {
  readonly version: number;
  readonly owner: Buffer;
  readonly propellerEnabled: boolean;
  readonly targetTokenId: number;
  readonly gasKickstart: boolean;
  readonly maxFee: BN;
  readonly memo: Buffer;
}

export function encodeSwimPayload(swimPayload: ParsedSwimPayload): Buffer {
  const encoded = Buffer.alloc(
    1 + //version
      32 + //owner
      1 + //propellerEnabled
      1 + //gasKickstart
      8 + //maxFee
      2 + //targetTokenId (u16)
      16, //memo
  );
  let offset = 0;
  encoded.writeUint8(swimPayload.version, offset);
  offset++;
  encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
  offset += 32;
  encoded.writeUint8(Number(swimPayload.propellerEnabled), offset);
  offset++;
  encoded.writeUint8(Number(swimPayload.gasKickstart), offset);
  offset++;
  encoded.writeBigUint64BE(BigInt(swimPayload.maxFee.toNumber()), offset);
  offset += 8;

  encoded.writeUint16BE(swimPayload.targetTokenId, offset);
  offset += 2;
  encoded.write(swimPayload.memo.toString("hex"), offset, "hex");
  // offset += 16;
  return encoded;
}

export function parseSwimPayload(arr: Buffer): ParsedSwimPayload {
  //BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt()
  let offset = 0;
  const version = arr.readUint8(offset);
  offset++;
  const owner = arr.subarray(offset, offset + 32);
  offset += 32;
  const propellerEnabled = arr.readUint8(offset) === 1;
  offset++;
  const gasKickstart = arr.readUint8(offset) === 1;
  offset++;
  const maxFee = new BN(Number(arr.readBigUint64BE(offset)));
  offset += 8;
  const targetTokenId = arr.readUint16BE(offset);
  offset += 2;
  const memo = arr.subarray(offset, offset + 16);
  // offset += 16;

  return {
    version,
    owner,
    propellerEnabled,
    gasKickstart,
    maxFee,
    targetTokenId,
    memo,
  };
  // return {
  //   version: arr.readUint8(0),
  //   targetTokenId: arr.readUint16BE(1),
  //   targetToken: arr.subarray(3, 3 + 32),
  //   owner: arr.subarray(35, 35 + 32),
  //   minOutputAmount: BigNumber.from(arr.subarray(67, 67 + 32)).toBigInt(),
  //   // minOutputAmount: arr.readBigUInt64BE(67),
  //   propellerEnabled: arr.readUint8(99) === 1,
  //   // propellerFee: arr.readBigUInt64BE(100),
  //   propellerFee: BigNumber.from(arr.subarray(100, 100 + 32)).toBigInt(),
  //   gasKickstart: arr.readUint8(132) === 1,
  // }
}
export type PostVAAData = {
  readonly version: number;
  readonly guardianSetIndex: number;
  readonly timestamp: number;
  readonly nonce: number;
  readonly emitterChain: number;
  readonly emitterAddress: Buffer;
  readonly sequence: BN;
  readonly consistencyLevel: number;
  readonly payload: Buffer;
};

// export function toPostVAAData(signedVaa: Buffer): PostVAAData {
//   // const {
//   //   consistencyLevel,
//   //   data,
//   //   emitterAddress,
//   //   emitterChain,
//   //   guardianSignatures,
//   //   hash,
//   //   nonce,
//   //   sequence,
//   //   timestamp,
//   //   version
//   // } = parseVaa(signedVaa);
//   // return {
//   //   version,
//   //
//   // }
//   // const version = signedVaa.readUint8(0);
//   // const guardianSetIndex = signedVaa.readUint8(1);
//   // const timestamp = signedVaa.readUint32BE(2);
//   // const nonce = signedVaa.readUint32BE(6);
//   // const emitterChain = signedVaa.readUint8(10);
//   // const emitterAddress = signedVaa.subarray(11, 11 + 32);
//   // const sequence = anchor.BN.fromBuffer(signedVaa.subarray(43, 43 + 32));
//   // const consistencyLevel = signedVaa.readUint8(75);
//   // const payload = signedVaa.subarray(76);
//   // return {
//   //   version,
//   //   guardianSetIndex,
//   //   timestamp,
//   //   nonce,
//   //   emitterChain,
//   //   emitterAddress,
//   //   sequence,
//   //   consistencyLevel,
//   //   payload,
//   // }
// }

export function parseU256(arr: Buffer): bigint {
  return BigNumber.from(arr.subarray(0, 32)).toBigInt();
}

export interface ParsedTokenTransferWithSwimPayloadVaa {
  // core: ParsedVaa,
  // tokenTransfer: ParsedTokenTransfer;
  readonly tokenTransferVaa: ParsedTokenTransferSignedVaa;
  readonly swimPayload: ParsedSwimPayload;
}
export const parseTokenTransferWithSwimPayloadSignedVaa = (
  signedVaa: Buffer,
): ParsedTokenTransferWithSwimPayloadVaa => {
  const parsedTokenTransfer = parseTokenTransferSignedVaa(signedVaa);
  const payload = parsedTokenTransfer.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferVaa: parsedTokenTransfer,
    swimPayload,
  };
};

export const formatParsedTokenTransferWithSwimPayloadVaa = (
  parsed: ParsedTokenTransferWithSwimPayloadVaa,
) => {
  const formattedTokenTransfer = formatParsedTokenTransferSignedVaa(
    parsed.tokenTransferVaa,
  );
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(
    swimPayload,
    parsed.tokenTransferVaa.tokenTransfer.toChain,
  );
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };
};

export const formatSwimPayload = (
  swimPayload: ParsedSwimPayload,
  chain: ChainId | ChainName,
) => {
  return {
    ...swimPayload,
    // minOutputAmount: swimPayload.minOutputAmount.toString(),
    memo: swimPayload.memo.toString(),
    // minThreshold: swimPayload.minThreshold.toString(),
    owner: tryUint8ArrayToNative(swimPayload.owner, chain),
    maxFee: swimPayload.maxFee.toString(),
  };
};

export interface ParsedTokenTransferWithSwimPayloadPostedMessage {
  readonly tokenTransferMessage: ParsedTokenTransferPostedMessage;
  readonly swimPayload: ParsedSwimPayload;
}

export const parseTokenTransferWithSwimPayloadPostedMessage = async (
  message: Buffer,
): Promise<ParsedTokenTransferWithSwimPayloadPostedMessage> => {
  const parsedTokenTransferMsg = await parseTokenTransferPostedMessage(message);
  const payload = parsedTokenTransferMsg.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferMessage: parsedTokenTransferMsg,
    swimPayload,
  };
};

export const formatParsedTokenTransferWithSwimPayloadPostedMessage = (
  parsed: ParsedTokenTransferWithSwimPayloadPostedMessage,
) => {
  const formattedTokenTransfer = formatParsedTokenTransferPostedMessage(
    parsed.tokenTransferMessage,
  );
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(
    swimPayload,
    parsed.tokenTransferMessage.tokenTransfer.toChain,
  );
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };
};
