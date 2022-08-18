import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  tryNativeToHexString,
  getSignedVAAHash,
  hexToUint8Array,
  tryHexToNativeAssetString,
  toChainName,
} from "@certusone/wormhole-sdk";
import { web3, BN } from "@project-serum/anchor";
import * as BufferLayout from "@solana/buffer-layout";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as byteify from "byteify";
// import { toBigNumberHex } from "./utils";
import {
  formatParsedVaa,
  formatPostedMessage,
  ParsedPostedMessage,
  ParsedVaa,
  parsePostedMessage,
  parseVaa,
  signAndEncodeVaa,
  WORMHOLE_TOKEN_BRIDGE,
} from "./wormhole-utils";
import { BigNumber, BigNumberish } from "ethers";
// import { PostVaaMethod } from "./types";
import keccak256 from "keccak256";
import { tryUint8ArrayToNative } from "@certusone/wormhole-sdk/lib/cjs/utils/array";

export function toBigNumberHex(value: BigNumberish, numBytes: number): string {
  return BigNumber.from(value)
    .toHexString()
    .substring(2)
    .padStart(numBytes * 2, "0");
}

export type PostVaaMethod = (
  connection: web3.Connection,
  signTransaction: (transaction: web3.Transaction) => Promise<web3.Transaction>,
  bridge_id: string,
  payer: string,
  vaa: Buffer,
  maxRetries: number,
) => Promise<void>;

export function encodeTokenBridgeRegistration(
  chain: ChainId,
  bridgeAddress: string,
) {
  const encoded = Buffer.alloc(69);

  // required label for governance
  const label = Buffer.from("TokenBridge");
  encoded.write(label.toString("hex"), 32 - label.length, "hex");
  encoded.writeUint8(1, 32);
  // skip 2 bytes
  encoded.writeUint16BE(chain as number, 35);
  encoded.write(tryNativeToHexString(bridgeAddress, chain), 37, "hex");

  return encoded;
}

export function encodeAttestMeta(
  tokenAddress: Buffer,
  tokenChain: number,
  decimals: number,
  symbol: string,
  name: string,
) {
  if (tokenAddress.length != 32) {
    throw Error("tokenAddress.length != 32");
  }

  if (symbol.length > 64) {
    throw Error("symbol.length > 64");
  }

  if (name.length > 64) {
    throw Error("name.length > 64");
  }

  const encoded = Buffer.alloc(100);
  encoded.writeUint8(2, 0);
  encoded.write(tokenAddress.toString("hex"), 1, "hex");
  encoded.writeUint16BE(tokenChain, 33);
  encoded.writeUint8(decimals, 35);
  encoded.write(symbol, 37);
  encoded.write(name, 68);

  return encoded;
}

/**
 *
 * #[derive(PartialEq, Debug, Clone)]
 * pub struct PayloadTransfer {
 *     /// Amount being transferred (big-endian uint256)
 *     pub amount: U256,
 *     /// Address of the token. Left-zero-padded if shorter than 32 bytes
 *     pub token_address: Address,
 *     /// Chain ID of the token
 *     pub token_chain: u16,
 *     /// Address of the recipient. Left-zero-padded if shorter than 32 bytes
 *     pub to: Address,
 *     /// Chain ID of the recipient
 *     pub to_chain: ChainID,
 *     /// Amount of tokens (big-endian uint256) that the user is willing to pay as relayer fee. Must be <= Amount.
 *     pub fee: U256,
 * }
 */
export function encodeTokenTransfer(
  amount: string,
  tokenAddress: Buffer,
  tokenChain: number,
  receiver: web3.PublicKey,
) {
  const encoded = Buffer.alloc(133);
  encoded.writeUint8(1, 0); // regular transfer
  encoded.write(toBigNumberHex(amount, 32), 1, "hex");
  encoded.write(tokenAddress.toString("hex"), 33, "hex");
  encoded.writeUint16BE(tokenChain, 65);
  encoded.write(
    tryNativeToHexString(receiver.toString(), CHAIN_ID_SOLANA),
    67,
    "hex",
  );
  encoded.writeUint16BE(CHAIN_ID_SOLANA as number, 99);

  // last 32 bytes is a fee, which we are setting to zero. So noop
  return encoded;
}

/**
 * pub struct PayloadTransferWithPayload {
 * 	/// Amount being transferred (big-endian uint256)
 * 	pub amount: U256, //32
 * 	/// Address of the token. Left-zero-padded if shorter than 32 bytes
 * 	pub token_address: [u8;32], //32
 * 	/// Chain ID of the token
 * 	pub token_chain: u16, //2
 * 	/// Address of the recipient. Left-zero-padded if shorter than 32 bytes
 * 	pub to: [u8;32],
 * 	/// Chain ID of the recipient
 * 	pub to_chain: ChainID,
 *
 * 	/// TODO: only this one needs to be `Address` since it should come from the evm contract/user
 * 	/// Sender of the transaction
 * 	pub from_address: [u8;32],
 * 	/// Arbitrary payload
 * 	pub payload: Vec<u8>,
 * }
 */
export function encodeTokenTransferWithPayload(
  amount: string,
  tokenAddress: Buffer,
  tokenChain: number,
  to: web3.PublicKey,
  from: Buffer,
  payload: Buffer,
) {
  const encoded = Buffer.alloc(
    1 + //payloadType
      32 + //amount
      32 + //tokenAddress
      2 + //tokenChain
      32 + //to
      2 + //to_chain
      // + 32  //fee
      32 + //from_address
      payload.length,
  );

  console.log(
    `[encodeTokenTransferWithPayload] - encoded.length: ${encoded.length}`,
  );
  console.log(`
		amountHexLenght: ${toBigNumberHex(amount, 32).length}
		tokenAddrHexLength: ${tokenAddress.toString("hex").length}
		receiverHexLength: ${
      tryNativeToHexString(to.toString(), CHAIN_ID_SOLANA).length
    }
		fromHexLength: ${from.toString("hex").length}
		payloadHexLength: ${payload.toString("hex").length}
	`);
  //payloadType
  encoded.writeUint8(3, 0); // transfer with payload
  //amount
  encoded.write(toBigNumberHex(amount, 32), 1, "hex"); //u256
  //tokenAddress
  encoded.write(tokenAddress.toString("hex"), 33, "hex"); //address
  //tokenChain
  encoded.writeUint16BE(tokenChain, 65);
  //to
  encoded.write(
    tryNativeToHexString(to.toString(), CHAIN_ID_SOLANA),
    67,
    "hex",
  );
  //to_chain
  encoded.writeUint16BE(CHAIN_ID_SOLANA as number, 99);
  //from_address
  encoded.write(from.toString("hex"), 101, "hex");
  // //TODO: not sure if this is correct. may need to make a "swimPayload" type with a "to_wormhole_encoding()" method
  encoded.write(payload.toString("hex"), 133, "hex");
  //fee
  // encoded.write(toBigNumberHex(amount, 32), 101, "hex");
  //from_address
  // encoded.write(from.toString("hex"), 133, "hex");
  //
  // //TODO: not sure if this is correct. may need to make a "swimPayload" type with a "to_wormhole_encoding()" method
  // encoded.write(payload.toString("hex"), 165, "hex");
  return encoded;
}

/**
 * // Convert a full VAA structure into the serialization of its unique components, this structure is
 * // what is hashed and verified by Guardians.
 * pub fn serialize_vaa(vaa: &PostVAAData) -> Vec<u8> {
 *     let mut v = Cursor::new(Vec::new());
 *     v.write_u32::<BigEndian>(vaa.timestamp).unwrap();
 *     v.write_u32::<BigEndian>(vaa.nonce).unwrap();
 *     v.write_u16::<BigEndian>(vaa.emitter_chain).unwrap();
 *     v.write_all(&vaa.emitter_address).unwrap();
 *     v.write_u64::<BigEndian>(vaa.sequence).unwrap();
 *     v.write_u8(vaa.consistency_level).unwrap();
 *     v.write_all(&vaa.payload).unwrap();
 *     v.into_inner()
 * }
 *
 * // Hash a VAA, this combines serialization and hashing.
 * pub fn hash_vaa(vaa: &PostVAAData) -> [u8; 32] {
 *     let body = serialize_vaa(vaa);
 *     let mut h = sha3::Keccak256::default();
 *     h.write_all(body.as_slice()).unwrap();
 *     h.finalize().into()
 * }
 */
export interface GuardianSignature {
  r: Buffer;
  s: Buffer;
  v: number;
}

export function hashVaa(signedVaa: Buffer): Buffer {
  const sigStart = 6;
  const numSigners = signedVaa[5]!;
  const sigLength = 66;

  const body = signedVaa.subarray(sigStart + sigLength * numSigners);
  return keccak256(body);
}

// export function parseVaa(signedVaa: Buffer): ParsedVaa {
// 	const sigStart = 6;
// 	const numSigners = signedVaa[5];
// 	const sigLength = 66;
//
// 	const guardianSignatures: GuardianSignature[] = [];
// 	for (let i = 0; i < numSigners; ++i) {
// 		const start = i * sigLength + 1;
// 		guardianSignatures.push({
// 			r: signedVaa.subarray(start, start + 32),
// 			s: signedVaa.subarray(start + 32, start + 64),
// 			v: signedVaa[start + 64],
// 		});
// 	}
//
// 	const body = signedVaa.subarray(sigStart + sigLength * numSigners);
//
// 	return {
// 		version: signedVaa[0]!,
// 		guardianSignatures,
// 		timestamp: body.readUint32BE(0),
// 		nonce: body.readUint32BE(4),
// 		emitterChain: body.readUint16BE(8) as ChainId,
// 		emitterAddress: body.subarray(10, 42),
// 		sequence: body.readBigUint64BE(42),
// 		consistencyLevel: body[50]!,
// 		data: body.subarray(51),
// 		hash: keccak256(body),
// 	};
// }

export const deriveMessagePda = async (
  signedVaa: Buffer,
  programId: web3.PublicKey,
) => {
  const hash = hashVaa(signedVaa);
  // const hexHash = await getSignedVAAHash(signedVaa);
  // const hash2 = Buffer.from(hexToUint8Array(hexHash));
  // console.log(`
  //   hash: ${hash.toString("hex")}
  //   hash2: ${hash2.toString("hex")}
  // `);

  // hash: 274c0a03bb0adc52db0ed7da9b420b124a1f0f26e453a65abb55a7c7fd97da27
  // hash2: 0x16d2678d4355b164a74337080f7141f3b8f54ed951156118a3f4af4b9d09450c
  // hash2BufferHex: 307831366432363738643433353562313634613734333337303830663731343166336238663534656439353131353631313861336634616634623964303934353063
  // const hash2 = await getSignedVAAHash(Uint8Array.from(signedVaa));
  // console.log(`
  // 	hash: ${hash.toString("hex")}
  // 	hash2: ${hash2}
  // 	hash2BufferHex: ${Buffer.from(hash2).toString("hex")}
  // `);
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from("PostedVAA"), hash],
    programId,
  );
};

export const deriveEndpointPda = async (
  foreignChain: ChainId,
  foreignTokenBridge: Buffer,
  programId: web3.PublicKey,
) => {
  return await web3.PublicKey.findProgramAddress(
    [byteify.serializeUint16(foreignChain as number), foreignTokenBridge],
    programId,
  );
};

export interface ParsedAttestMetaVaa {
  core: ParsedVaa;
  address: Buffer;
  chain: ChainId;
  decimals: number;
  symbol: string;
  name: string;
}

export function parseAttestMetaVaa(signedVaa: Buffer): ParsedAttestMetaVaa {
  const parsed = parseVaa(signedVaa);
  const data = parsed.data;
  return {
    core: parsed,
    address: data.subarray(1, 33),
    chain: data.readUint16BE(33) as ChainId,
    decimals: data[35]!,
    symbol: data.subarray(36, 68).toString().replace("\0", ""),
    name: data.subarray(68, 100).toString().replace("\0", ""),
  };
}

// should have used generics on this instead.smh.
export interface ParsedTokenTransferSignedVaa {
  core: ParsedVaa;
  tokenTransfer: ParsedTokenTransfer;
}
export interface ParsedTokenTransferPostedMessage {
  core: ParsedPostedMessage;
  tokenTransfer: ParsedTokenTransfer;
}

export interface ParsedTokenTransfer {
  messageType: number;
  amount: string;
  tokenAddress: Buffer;
  tokenChain: ChainId;
  to: Buffer;
  toChain: ChainId;
  fromAddress: Buffer;
  // fee: string;
  payload: Buffer;
}

export function parseTokenTransferSignedVaa(
  signedVaa: Buffer,
): ParsedTokenTransferSignedVaa {
  const parsed = parseVaa(signedVaa);
  const data = parsed.data;
  const tokenTransfer = parseTokenTransfer(data);
  return {
    core: parsed,
    tokenTransfer,
    // messageType: data[0]!,
    // amount: new BN(data.subarray(1, 33)).toString(),
    // tokenAddress: data.subarray(33, 65),
    // tokenChain: data.readUint16BE(65) as ChainId,
    // to: data.subarray(67, 99),
    // toChain: data.readUint16BE(99) as ChainId,
    // fromAddress: data.subarray(101, 133),
    // payload: data.subarray(133),
  };
}

function parseTokenTransfer(data: Buffer): ParsedTokenTransfer {
  return {
    messageType: data[0]!,
    amount: new BN(data.subarray(1, 33)).toString(),
    tokenAddress: data.subarray(33, 65),
    tokenChain: data.readUint16BE(65) as ChainId,
    to: data.subarray(67, 99),
    toChain: data.readUint16BE(99) as ChainId,
    fromAddress: data.subarray(101, 133),
    payload: data.subarray(133),
  };
}

export async function parseTokenTransferPostedMessage(
  postedMessage: Buffer,
): Promise<ParsedTokenTransferPostedMessage> {
  const parsed = await parsePostedMessage(postedMessage);
  const data = parsed.data;
  const tokenTransfer = parseTokenTransfer(data);
  return {
    core: parsed,
    tokenTransfer,
  };
}

export function formatParsedTokenTransferPostedMessage(
  parsedMessage: ParsedTokenTransferPostedMessage,
) {
  const formattedParsedVaa = formatPostedMessage(parsedMessage.core);
  const formattedTokenTransfer = formatParsedTokenTransfer(
    parsedMessage.tokenTransfer,
  );

  return {
    // ...parsedVaa,
    core: formattedParsedVaa,
    tokenTransfer: formattedTokenTransfer,
  };
}
export function formatParsedTokenTransferSignedVaa(
  parsedVaa: ParsedTokenTransferSignedVaa,
) {
  const formattedParsedVaa = formatParsedVaa(parsedVaa.core);
  const formattedTokenTransfer = formatParsedTokenTransfer(
    parsedVaa.tokenTransfer,
  );

  return {
    // ...parsedVaa,
    core: formattedParsedVaa,
    tokenTransfer: formattedTokenTransfer,
    // tokenTransfer: {
    //   ...parsedTokenTransfer,
    //   amount: parsedTokenTransfer.amount.toString(),
    //   // tokenAddress: tryHexToNativeAssetString(parsedTokenTransfer.tokenAddress, parsedTokenTransfer.tokenChain),
    //   tokenAddress: tryUint8ArrayToNative(parsedTokenTransfer.tokenAddress, parsedTokenTransfer.tokenChain),
    //   tokenChain: toChainName(parsedTokenTransfer.tokenChain),
    //   // to: tryHexToNativeAssetString(parsedTokenTransfer.to, parsedTokenTransfer.toChain),
    //   to: tryUint8ArrayToNative(parsedTokenTransfer.to, parsedTokenTransfer.toChain),
    //   toChain: toChainName(parsedTokenTransfer.toChain),
    //   fromAddress: tryUint8ArrayToNative(parsedTokenTransfer.fromAddress, formattedParsedVaa.emitterChain),
    // }
  };
}

function formatParsedTokenTransfer(parsedTokenTransfer: ParsedTokenTransfer) {
  return {
    ...parsedTokenTransfer,
    amount: parsedTokenTransfer.amount.toString(),
    tokenAddress: tryUint8ArrayToNative(
      parsedTokenTransfer.tokenAddress,
      parsedTokenTransfer.tokenChain,
    ),
    tokenChain: toChainName(parsedTokenTransfer.tokenChain),
    to: tryUint8ArrayToNative(
      parsedTokenTransfer.to,
      parsedTokenTransfer.toChain,
    ),
    toChain: toChainName(parsedTokenTransfer.toChain),
    fromAddress: tryUint8ArrayToNative(
      parsedTokenTransfer.fromAddress,
      parsedTokenTransfer.tokenChain,
    ),
    payload: parsedTokenTransfer.payload.toString("hex"),
  };
}

// below is experimental and is not used in the program test

// Couldn't find an export in the spl token program so Dev just looked it up on rust docs
// https://docs.rs/spl-token-metadata/latest/src/spl_token_metadata/lib.rs.html#14
export const SPL_METADATA_PROGRAM = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);
export async function getMintMetaPdas(mintKey: web3.PublicKey) {
  // const programId = this.programId;
  const [splMetaKey] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      SPL_METADATA_PROGRAM.toBuffer(),
      mintKey.toBuffer(),
    ],
    SPL_METADATA_PROGRAM,
  );
  const [mintMetaKey] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("meta"), mintKey.toBuffer()],
    WORMHOLE_TOKEN_BRIDGE,
  );

  return [splMetaKey, mintMetaKey];
}
//
// const CreateWrappedData = BufferLayout.struct<Readonly<{}>>([]);
//
// export enum TokenBridgeInstruction {
// 	CreateWrapped = 7,
// }

// export class TokenBridgeProgram {
// 	connection: web3.Connection;
// 	programId: web3.PublicKey;
// 	wormhole: web3.PublicKey;
// 	postVaaWithRetry: PostVaaMethod;
//
// 	// pdas
// 	config: web3.PublicKey;
// 	mintAuthority: web3.PublicKey;
//
// 	constructor(
// 		connection: web3.Connection,
// 		programId: web3.PublicKey,
// 		wormhole: web3.PublicKey,
// 		postVaaWithRetry: PostVaaMethod
// 	) {
// 		this.connection = connection;
// 		this.programId = programId;
// 		this.wormhole = wormhole;
// 		this.postVaaWithRetry = postVaaWithRetry;
//
// 		this.config = deriveAddress([Buffer.from("config")], this.programId);
// 		this.mintAuthority = deriveAddress([Buffer.from("mint_signer")], this.programId);
// 	}
//
// 	deriveEmitterPda(foreignChain: ChainId, foreignTokenBridge: Buffer) {
// 		return deriveAddress([byteify.serializeUint16(foreignChain as number), foreignTokenBridge], this.programId);
// 	}
//
// 	deriveMessagePda(hash: Buffer) {
// 		return deriveAddress([Buffer.from("PostedVAA"), hash], this.wormhole);
// 	}
//
// 	deriveClaimPda(foreignChain: ChainId, foreignTokenBridge: Buffer, sequence: bigint) {
// 		return deriveAddress(
// 			[foreignTokenBridge, byteify.serializeUint16(foreignChain as number), byteify.serializeUint64(Number(sequence))],
// 			this.programId
// 		);
// 	}
//
// 	deriveMintPdas(tokenChain: ChainId, tokenAddress: Buffer) {
// 		const programId = this.programId;
// 		const mintKey = deriveAddress(
// 			[Buffer.from("wrapped"), byteify.serializeUint16(tokenChain), tokenAddress],
// 			programId
// 		);
// 		const mintMetaKey = deriveAddress([Buffer.from("meta"), mintKey.toBuffer()], programId);
// 		return [mintKey, mintMetaKey];
// 	}
//
// 	async createWrapped(payer: web3.Keypair, attestMetaSignedVaa: Buffer) {
// 		// first post signed vaa to wormhole
// 		console.log("posting");
// 		await this.postVaa(payer, attestMetaSignedVaa);
// 		console.log("posted");
//
// 		// Deserialize signed vaa
// 		const attestedMeta = parseAttestMetaVaa(attestMetaSignedVaa);
// 		const core = attestedMeta.core;
//
// 		// All the keys
// 		const token_config_acc = this.config;
// 		const endpoint_acc = this.deriveEmitterPda(core.emitterChain, core.emitterAddress);
// 		const coreVaa = this.deriveMessagePda(core.hash);
// 		console.log("coreVaa", coreVaa.toString());
//
// 		const tokenVaa = this.deriveClaimPda(core.emitterChain, core.emitterAddress, core.sequence);
// 		const [mintKey, mintMetaKey] = this.deriveMintPdas(attestedMeta.chain, attestedMeta.address);
//
// 		const splMetadata = deriveAddress(
// 			[Buffer.from("metadata"), SPL_METADATA_PROGRAM.toBuffer(), mintKey.toBuffer()],
// 			SPL_METADATA_PROGRAM
// 		);
//
// 		const mintAuthorityKey = this.mintAuthority;
//
// 		const createWrappedKeys: web3.AccountMeta[] = [
// 			{ pubkey: payer.publicKey, isSigner: true, isWritable: true },
// 			{ pubkey: token_config_acc, isSigner: false, isWritable: false },
// 			{ pubkey: endpoint_acc, isSigner: false, isWritable: false },
// 			{ pubkey: coreVaa, isSigner: false, isWritable: false },
// 			{ pubkey: tokenVaa, isSigner: false, isWritable: true },
// 			{ pubkey: mintKey, isSigner: false, isWritable: true },
// 			{ pubkey: mintMetaKey, isSigner: false, isWritable: true },
// 			{ pubkey: splMetadata, isSigner: false, isWritable: true },
// 			{ pubkey: mintAuthorityKey, isSigner: false, isWritable: false },
// 			{ pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
// 			{ pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
// 			{ pubkey: this.wormhole, isSigner: false, isWritable: false },
// 			{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
// 			{ pubkey: SPL_METADATA_PROGRAM, isSigner: false, isWritable: false },
// 		];
// 		console.log(createWrappedKeys);
// 		const latestBlockhash = await this.connection.getLatestBlockhash("confirmed");
// 		let transaction = new web3.Transaction({
// 			feePayer: payer.publicKey,
// 			blockhash: latestBlockhash.blockhash,
// 			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
// 		});
// 		/*
// 		let createWrappedStruct = {
// 		  index: TokenBridgeInstruction.CreateWrapped,
// 		  layout: BufferLayout.struct([]), //CreateWrapped takes no arguements
// 		};
// 		let data = Buffer.alloc(createWrappedStruct.layout.span);
// 		let layoutFields = Object.assign({ instruction: createWrappedStruct.index }, {});
// 		createWrappedStruct.layout.encode(layoutFields, data);
// 		console.log("createWrappedStruct", createWrappedStruct);
// 		*/
// 		const instructionData = Buffer.alloc(1);
// 		instructionData.writeUint8(7);
//
// 		transaction.add.rs(
// 			new web3.TransactionInstruction({
// 				keys: createWrappedKeys,
// 				programId: this.programId,
// 				data: instructionData,
// 			})
// 		);
//
// 		console.log("transaction", transaction);
// 		transaction.partialSign(payer);
//
// 		const response = await this.connection
// 		                           .sendRawTransaction(transaction.serialize(), { skipPreflight: true })
// 		                           .then((tx) => this.connection.confirmTransaction(tx, "confirmed"));
//
// 		return response;
// 	}
//
// 	async postVaa(payer: web3.Keypair, signedVaa: Buffer): Promise<void> {
// 		//return postVaa(this.program.provider.connection, payer, this.wormhole, signedVaa);
// 		await this.postVaaWithRetry(
// 			this.connection,
// 			async (tx) => {
// 				tx.partialSign(payer);
// 				return tx;
// 			},
// 			this.wormhole.toString(),
// 			payer.publicKey.toString(),
// 			signedVaa,
// 			10
// 		);
// 	}
// }

// export class DummyEthTokenBridge {
// 	emitterChain: ChainId;
// 	emitterAddress: Buffer;
// 	sequence: number;
//
// 	constructor(address: string) {
// 		this.emitterChain = CHAIN_ID_ETH;
// 		this.emitterAddress = Buffer.from(tryNativeToHexString(address, this.emitterChain), "hex");
//
// 		// uptick this
// 		this.sequence = 0;
// 	}
//
// 	attestMeta(tokenAddress: Buffer, tokenChain: ChainId, decimals: number, symbol: string, name: string) {
// 		return signAndEncodeVaa(
// 			0,
// 			0,
// 			this.emitterChain as number,
// 			this.emitterAddress,
// 			1,
// 			encodeAttestMeta(tokenAddress, tokenChain, decimals, symbol, name)
// 		);
// 	}
// }
