import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_SOLANA,
  importCoreWasm,
  tryHexToNativeAssetString,
} from "@certusone/wormhole-sdk";
import { tryUint8ArrayToNative } from "@certusone/wormhole-sdk/lib/cjs/utils/array";
import { PublicKey } from "@solana/web3.js";
import keccak256 from "keccak256";

export const WORMHOLE_CORE_BRIDGE = new PublicKey(
  "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
);
export const WORMHOLE_TOKEN_BRIDGE = new PublicKey(
  "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
);

const elliptic = require("elliptic");
/** from wormhole-icco **/
export function signAndEncodeVaa(
  timestamp: number,
  nonce: number,
  emitterChainId: number,
  emitterAddress: Buffer,
  sequence: bigint,
  data: Buffer,
): Buffer {
  if (emitterAddress.length != 32) {
    throw Error("emitterAddress != 32 bytes");
  }

  // wormhole initialized with only one guardian in devnet
  const signers = [
    "cfb12303a19cde580bb4dd771639b0d26bc68353645571a8cff516ab2ee113a0",
  ];

  const sigStart = 6;
  const numSigners = signers.length;
  const sigLength = 66;
  const bodyStart = sigStart + sigLength * numSigners;
  const bodyHeaderLength = 51;
  const vm = Buffer.alloc(bodyStart + bodyHeaderLength + data.length);

  // header
  const guardianSetIndex = 0;

  vm.writeUInt8(1, 0);
  vm.writeUInt32BE(guardianSetIndex, 1);
  vm.writeUInt8(numSigners, 5);

  // encode body with arbitrary consistency level
  const consistencyLevel = 1;

  vm.writeUInt32BE(timestamp, bodyStart);
  vm.writeUInt32BE(nonce, bodyStart + 4);
  vm.writeUInt16BE(emitterChainId, bodyStart + 8);
  vm.write(emitterAddress.toString("hex"), bodyStart + 10, "hex");
  vm.writeBigUInt64BE(BigInt(sequence), bodyStart + 42);
  vm.writeUInt8(consistencyLevel, bodyStart + 50);
  vm.write(data.toString("hex"), bodyStart + bodyHeaderLength, "hex");

  // signatures
  const hash = keccak256(keccak256(vm.subarray(bodyStart)));

  for (let i = 0; i < numSigners; ++i) {
    const ec = new elliptic.ec("secp256k1");
    const key = ec.keyFromPrivate(signers[i]);
    const signature = key.sign(hash, { canonical: true });

    const start = sigStart + i * sigLength;
    vm.writeUInt8(i, start);
    vm.write(signature.r.toString(16).padStart(64, "0"), start + 1, "hex");
    vm.write(signature.s.toString(16).padStart(64, "0"), start + 33, "hex");
    vm.writeUInt8(signature.recoveryParam, start + 65);
  }

  return vm;
}

export interface GuardianSignature {
  readonly r: Buffer;
  readonly s: Buffer;
  readonly v: number;
}

export interface ParsedVaa {
  readonly version: number;
  readonly guardianSignatures: readonly GuardianSignature[];
  readonly timestamp: number;
  readonly nonce: number;
  readonly emitterChain: ChainId;
  readonly emitterAddress: Buffer;
  readonly sequence: bigint;
  readonly consistencyLevel: number;
  readonly data: Buffer;
  readonly hash: Buffer;
}
//{
//  "vaa_version":0,
//  "consistency_level":32,
//  "vaa_time":0,
//  "vaa_signature_account":"11111111111111111111111111111111",
//  "submission_time":1660407020,
//  "nonce":48460,
//  "sequence":0,
//  "emitter_chain":1,
//  "emitter_address":"ENG1wQ7CQKH8ibAJ1hSLmJgL9Ucg6DRDbj752ZAfidLA"
//  }
export interface ParsedPostedMessage {
  readonly vaaVersion: number;
  readonly vaaSignatureAccount: Buffer;
  readonly timestamp: number;
  readonly nonce: number;
  readonly emitterChain: ChainId;
  readonly emitterAddress: Buffer;
  readonly sequence: bigint;
  readonly consistencyLevel: number;
  readonly data: Buffer;
  // hash: Buffer;
}

export async function parsePostedMessage(
  postedMessageBuffer: Buffer,
): Promise<ParsedPostedMessage> {
  const { parse_posted_message } = await importCoreWasm();
  const postedMessage = parse_posted_message(postedMessageBuffer);
  return {
    vaaVersion: postedMessage.vaa_version,
    vaaSignatureAccount: Buffer.from(postedMessage.vaa_signature_account),
    timestamp: postedMessage.vaa_time,
    nonce: postedMessage.nonce,
    emitterChain: postedMessage.emitter_chain,
    emitterAddress: Buffer.from(postedMessage.emitter_address),
    sequence: postedMessage.sequence,
    consistencyLevel: postedMessage.consistency_level,
    data: Buffer.from(postedMessage.payload),
  };
}

export function formatPostedMessage(postedMessage: ParsedPostedMessage) {
  return {
    ...postedMessage,
    vaaSignatureAccount: tryUint8ArrayToNative(
      postedMessage.vaaSignatureAccount,
      CHAIN_ID_SOLANA,
    ),
    emitterAddress: tryUint8ArrayToNative(
      postedMessage.emitterAddress,
      postedMessage.emitterChain,
    ),
    sequence: postedMessage.sequence.toString(),
    data: postedMessage.data.toString("hex"),
  };
}

export function parseVaa(signedVaa: Buffer): ParsedVaa {
  const sigStart = 6;
  const numSigners = signedVaa[5]!;
  const sigLength = 66;

  const guardianSignatures: readonly GuardianSignature[] = [];
  for (let i = 0; i < numSigners; ++i) {
    const start = i * sigLength + 1;
    guardianSignatures.push({
      r: signedVaa.subarray(start, start + 32),
      s: signedVaa.subarray(start + 32, start + 64),
      v: signedVaa[start + 64]!,
    });
  }

  const body = signedVaa.subarray(sigStart + sigLength * numSigners);

  return {
    version: signedVaa[0]!,
    guardianSignatures,
    timestamp: body.readUint32BE(0),
    nonce: body.readUint32BE(4),
    emitterChain: body.readUint16BE(8) as ChainId,
    emitterAddress: body.subarray(10, 42),
    sequence: body.readBigUint64BE(42),
    consistencyLevel: body[50]!,
    data: body.subarray(51),
    hash: keccak256(body),
  };
}

export function formatParsedVaa(parsedVaa: ParsedVaa) {
  const signatures = parsedVaa.guardianSignatures.map(({ r, s, v }) => {
    return {
      r: r.toString("hex"),
      s: s.toString("hex"),
      v,
    };
  });
  return {
    ...parsedVaa,
    data: parsedVaa.data.toString("hex"),
    hash: parsedVaa.hash.toString("hex"),
    sequence: parsedVaa.sequence.toString(),
    guardianSignatures: signatures,
    // emitter_address: tryHexToNativeAssetString(parsedVaa.emitterAddress.toString("hex"), parsedVaa.emitterChain),
    emitterAddress: tryUint8ArrayToNative(
      parsedVaa.emitterAddress,
      parsedVaa.emitterChain,
    ),
  };
}
