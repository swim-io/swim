import { PublicKey } from "@solana/web3.js";
/**
 * Adapted from https://github.com/solana-labs/solana-program-library/blob/0c0168f8a9d098c808d431ab7599a3e284a14e7d/token/js/src/errors.ts#L38-L41
 * Thrown if the owner of a token account is a PDA (Program Derived Address)
 */
export declare class TokenOwnerOffCurveError extends Error {
    name: string;
}
/**
 * Adapted from https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/util/to-buffer.ts
 */
export declare const toBuffer: (arr: Buffer | Uint8Array | readonly number[]) => Buffer;
/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/publickey.ts#L142-L168
 */
export declare const createProgramAddress: (seeds: readonly (Buffer | Uint8Array)[], programId: PublicKey) => PublicKey;
/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-web3.js/blob/ebcfe5e691cb0d4ae7290c562c7f49af4e6fb43e/src/publickey.ts#L170-L197
 */
export declare const findProgramAddress: (seeds: readonly (Buffer | Uint8Array)[], programId: PublicKey) => readonly [PublicKey, number];
/**
 * Synchronous adaptation of https://github.com/solana-labs/solana-program-library/blob/0c0168f8a9d098c808d431ab7599a3e284a14e7d/token/js/src/state/mint.ts#L135-L161
 */
export declare const getAssociatedTokenAddress: (mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean, programId?: PublicKey, associatedTokenProgramId?: PublicKey) => PublicKey;
