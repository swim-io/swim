import { sha256 } from "@ethersproject/sha2";
import { MAX_SEED_LENGTH, PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";

/**
 * Adapted from https://github.com/solana-labs/solana-program-library/blob/0c0168f8a9d098c808d431ab7599a3e284a14e7d/token/js/src/errors.ts#L38-L41
 * Thrown if the owner of a token account is a PDA (Program Derived Address)
 */
export class TokenOwnerOffCurveError extends Error {
  name = "TokenOwnerOffCurveError";
}

/**
 * Adapted from https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/util/to-buffer.ts
 */
export const toBuffer = (
  arr: Buffer | Uint8Array | readonly number[],
): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/publickey.ts#L142-L168
 */
export const createProgramAddress = (
  seeds: readonly (Buffer | Uint8Array)[],
  programId: PublicKey,
): PublicKey => {
  let buffer = Buffer.alloc(0);
  seeds.forEach(function (seed) {
    if (seed.length > MAX_SEED_LENGTH) {
      throw new TypeError(`Max seed length exceeded`);
    }
    buffer = Buffer.concat([buffer, toBuffer(seed)]);
  });
  buffer = Buffer.concat([
    buffer,
    programId.toBuffer(),
    Buffer.from("ProgramDerivedAddress"),
  ]);
  const hash = sha256(new Uint8Array(buffer)).slice(2);
  const publicKeyBytes = new BN(hash, 16).toArray(undefined, 32);
  if (PublicKey.isOnCurve(Uint8Array.from(publicKeyBytes))) {
    throw new Error(`Invalid seeds, address must fall off the curve`);
  }
  return new PublicKey(publicKeyBytes);
};

/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/publickey.ts#L170-L197
 */
export const findProgramAddress = (
  seeds: readonly (Buffer | Uint8Array)[],
  programId: PublicKey,
): readonly [PublicKey, number] => {
  let nonce = 255;
  let address;
  while (nonce !== 0) {
    try {
      const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
      address = createProgramAddress(seedsWithNonce, programId);
    } catch (err) {
      if (err instanceof TypeError) {
        throw err;
      }
      nonce--;
      continue;
    }
    return [address, nonce];
  }
  throw new Error(`Unable to find a viable program address nonce`);
};

/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-program-library/blob/0c0168f8a9d098c808d431ab7599a3e284a14e7d/token/js/src/state/mint.ts#L135-L161
 */
export const getAssociatedTokenAddress = (
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): PublicKey => {
  if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer()))
    throw new TokenOwnerOffCurveError();

  const [address] = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    associatedTokenProgramId,
  );

  return address;
};
