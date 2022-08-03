import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import type {
  AccountInfo,
  Commitment,
  ParsedTransactionWithMeta,
  TransactionBlockhashCtor,
} from "@solana/web3.js";
import { MAX_SEED_LENGTH, PublicKey, Transaction } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import { chunks, sleep } from "@swim-io/utils";
import BN from "bn.js";
import Decimal from "decimal.js";
import { ethers } from "ethers";
import type { QueryClient } from "react-query";

import type { SolanaWalletAdapter } from "../wallets";

import type { CustomConnection, SolanaConnection } from "./SolanaConnection";

const { sha256 } = ethers.utils;

export type WithSplTokenAccounts<T> = T & {
  readonly splTokenAccounts: readonly TokenAccount[];
};

/**
 * Adapted from https://github.com/solana-labs/solana-program-library/blob/0c0168f8a9d098c808d431ab7599a3e284a14e7d/token/js/src/errors.ts#L38-L41
 * Thrown if the owner of a token account is a PDA (Program Derived Address)
 */
export class TokenOwnerOffCurveError extends Error {
  override name = "TokenOwnerOffCurveError";
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

export const findAssociatedTokenAccountAddress = (
  mintAddress: string,
  walletAddress: string,
): string => {
  const associatedTokenAccountAddress = getAssociatedTokenAddress(
    new PublicKey(mintAddress),
    new PublicKey(walletAddress),
  );
  return associatedTokenAccountAddress.toBase58();
};

export const findTokenAccountForMint = (
  mintAddress: string,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): TokenAccount | null => {
  const associatedTokenAccountAddress = findAssociatedTokenAccountAddress(
    mintAddress,
    walletAddress,
  );
  return (
    splTokenAccounts.find(
      (tokenAccount) =>
        tokenAccount.mint.toBase58() === mintAddress &&
        tokenAccount.address.toBase58() === associatedTokenAccountAddress,
    ) ?? null
  );
};

interface ParsedSplTokenTransferInstruction {
  readonly program: string; // "spl-token"
  readonly programId: PublicKey;
  readonly parsed?: {
    readonly type: string; // "transfer"
    readonly info: {
      readonly amount: string;
      readonly authority: string;
      readonly destination: string;
      readonly source: string;
    };
  };
}

interface ParsedSplTokenMintToInstruction {
  readonly program: string; // "spl-token"
  readonly programId: PublicKey;
  readonly parsed?: {
    readonly type: string; // "mintTo"
    readonly info: {
      readonly account: string;
      readonly amount: string;
      readonly mint: string;
      readonly mintAuthority: string;
    };
  };
}

interface ParsedSplTokenBurnInstruction {
  readonly program: string; // "spl-token"
  readonly programId: PublicKey;
  readonly parsed?: {
    readonly type: string; // "burn"
    readonly info: {
      readonly account: string;
      readonly amount: string;
      readonly authority: string;
      readonly mint: string;
    };
  };
}

export const getAmountTransferredToAccount = (
  tx: ParsedTransactionWithMeta,
  userAccountAddress: string,
): Decimal => {
  for (const innerInstruction of tx.meta?.innerInstructions ?? []) {
    for (const innerInnerInstruction of innerInstruction.instructions as readonly ParsedSplTokenTransferInstruction[]) {
      const { parsed } = innerInnerInstruction;
      if (parsed === undefined || parsed.type !== "transfer") {
        continue;
      }
      const { info } = parsed;
      if (info.destination === userAccountAddress) {
        return new Decimal(info.amount);
      }
    }
  }

  return new Decimal(0);
};

export const getAmountTransferredToAccountByMint = (
  splTokenAccounts: readonly TokenAccount[],
  tx: ParsedTransactionWithMeta,
  mintAddress: string,
  walletAddress: string,
): Decimal => {
  const splTokenAccount = findTokenAccountForMint(
    mintAddress,
    walletAddress,
    splTokenAccounts,
  );
  if (splTokenAccount === null) {
    return new Decimal(0);
  }
  return getAmountTransferredToAccount(tx, splTokenAccount.address.toBase58());
};

export const getAmountTransferredFromAccount = (
  tx: ParsedTransactionWithMeta,
  userAccountAddress: string,
): Decimal => {
  for (const innerInstruction of tx.meta?.innerInstructions ?? []) {
    for (const innerInnerInstruction of innerInstruction.instructions as readonly ParsedSplTokenTransferInstruction[]) {
      const { parsed } = innerInnerInstruction;
      if (parsed === undefined || parsed.type !== "transfer") {
        continue;
      }
      const { info } = parsed;
      if (info.source === userAccountAddress) {
        return new Decimal(info.amount);
      }
    }
  }

  return new Decimal(0);
};

export const getAmountTransferredFromAccountByMint = (
  splTokenAccounts: readonly TokenAccount[],
  tx: ParsedTransactionWithMeta,
  mintAddress: string,
  walletAddress: string,
): Decimal => {
  const splTokenAccount = findTokenAccountForMint(
    mintAddress,
    walletAddress,
    splTokenAccounts,
  );
  if (splTokenAccount === null) {
    return new Decimal(0);
  }
  return getAmountTransferredFromAccount(
    tx,
    splTokenAccount.address.toBase58(),
  );
};

export const getAmountMintedToAccount = (
  tx: ParsedTransactionWithMeta,
  userAccountAddress: string,
): Decimal => {
  for (const innerInstruction of tx.meta?.innerInstructions ?? []) {
    for (const innerInnerInstruction of innerInstruction.instructions as readonly ParsedSplTokenMintToInstruction[]) {
      const { parsed } = innerInnerInstruction;
      if (parsed === undefined || parsed.type !== "mintTo") {
        continue;
      }
      const { info } = parsed;
      if (info.account === userAccountAddress) {
        return new Decimal(info.amount);
      }
    }
  }

  return new Decimal(0);
};

export const getAmountMintedToAccountByMint = (
  splTokenAccounts: readonly TokenAccount[],
  tx: ParsedTransactionWithMeta,
  mintAddress: string,
  walletAddress: string,
): Decimal => {
  const splTokenAccount = findTokenAccountForMint(
    mintAddress,
    walletAddress,
    splTokenAccounts,
  );
  if (splTokenAccount === null) {
    return new Decimal(0);
  }
  return getAmountMintedToAccount(tx, splTokenAccount.address.toBase58());
};

export const getAmountBurnedByMint = (
  tx: ParsedTransactionWithMeta,
  mintAddress: string,
): Decimal => {
  for (const innerInstruction of tx.meta?.innerInstructions ?? []) {
    for (const innerInnerInstruction of innerInstruction.instructions as readonly ParsedSplTokenBurnInstruction[]) {
      const { parsed } = innerInnerInstruction;
      if (parsed === undefined || parsed.type !== "burn") {
        continue;
      }
      const { info } = parsed;
      if (info.mint === mintAddress) {
        return new Decimal(info.amount);
      }
    }
  }

  return new Decimal(0);
};

export const txHasInstructionForProgramId = (
  tx: ParsedTransactionWithMeta | null,
  programId: string,
): boolean =>
  tx?.transaction.message.instructions.some(
    (ix) => ix.programId.toBase58() === programId,
  ) ?? false;

export const createSplTokenAccount = async (
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenMintAddress: string,
): Promise<string> => {
  if (!wallet.publicKey) {
    throw new Error("No Solana wallet connected");
  }
  const mint = new PublicKey(splTokenMintAddress);
  const associatedAccount = findAssociatedTokenAccountAddress(
    mint.toBase58(),
    wallet.publicKey.toBase58(),
  );
  const ix = Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    new PublicKey(associatedAccount),
    wallet.publicKey,
    wallet.publicKey,
  );

  const tx = createTx({
    feePayer: wallet.publicKey,
  });
  tx.add(ix);
  return solanaConnection.sendAndConfirmTx(
    wallet.signTransaction.bind(wallet),
    tx,
  );
};

export const findOrCreateSplTokenAccount = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  queryClient: QueryClient,
  splTokenMintAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): Promise<TokenAccount> => {
  if (!wallet.publicKey) {
    throw new Error("Solana wallet not connected");
  }
  const existingAccount = findTokenAccountForMint(
    splTokenMintAddress,
    wallet.publicKey.toBase58(),
    splTokenAccounts,
  );
  if (existingAccount) {
    return existingAccount;
  }
  const solanaAddress = wallet.publicKey.toBase58();
  const createSplTokenAccountTxId = await createSplTokenAccount(
    solanaConnection,
    wallet,
    splTokenMintAddress,
  );
  await solanaConnection.confirmTx(createSplTokenAccountTxId);
  await sleep(1000); // TODO: Find a better condition
  await queryClient.invalidateQueries(["tokenAccounts", env, solanaAddress]);
  return solanaConnection.getTokenAccountWithRetry(
    splTokenMintAddress,
    solanaAddress,
  );
};

type UnsafeConnection = CustomConnection & {
  // See https://github.com/solana-labs/solana/blob/5e424826ba52e643bbd8e761b7bee11f699eb46c/web3.js/src/connection.ts#L66

  readonly _rpcRequest: (methodName: string, args: readonly any[]) => any;
};

const getMultipleSolanaAccountsCore = async (
  solanaConnection: SolanaConnection,
  keys: readonly string[],
  commitment?: Commitment,
): Promise<{
  readonly keys: readonly string[];
  readonly array: readonly AccountInfo<readonly string[]>[];
}> => {
  const { rawConnection } = solanaConnection;
  const args = rawConnection._buildArgs([keys], commitment, "base64");

  // TODO: Replace with a public method once available
  // See https://github.com/solana-labs/solana/issues/12302
  const unsafeRes = (await (rawConnection as UnsafeConnection)._rpcRequest(
    "getMultipleAccounts",
    args,
  )) as {
    readonly error?: Record<string, unknown>;
    readonly result?: {
      readonly value?: readonly AccountInfo<readonly string[]>[];
    };
  };

  if (unsafeRes.error) {
    throw new Error(
      "Failed to get info about account " + String(unsafeRes.error.message),
    );
  }
  if (!unsafeRes.result?.value) {
    throw new Error("Failed to get info about account");
  }

  const array = unsafeRes.result.value;
  return { keys, array };
};

export interface AccountsResponse {
  readonly keys: readonly string[];
  readonly array: readonly AccountInfo<Buffer>[];
}

export const getMultipleSolanaAccounts = async (
  solanaConnection: SolanaConnection,
  keys: readonly string[],
  commitment?: Commitment,
): Promise<AccountsResponse> => {
  const result = await Promise.all(
    chunks(keys, 99).map((chunk) =>
      getMultipleSolanaAccountsCore(solanaConnection, [...chunk], commitment),
    ),
  );

  const array = result.flatMap((a) =>
    a.array.filter(Boolean).map((acc) => {
      const { data, ...rest } = acc;
      return {
        ...rest,
        data: Buffer.from(data[0], "base64"),
      };
    }),
  );
  return { keys, array };
};

type CreateTxOptions = Omit<
  TransactionBlockhashCtor,
  "blockhash" | "lastValidBlockHeight"
>;
/** Create transaction with dummy blockhash and lastValidBlockHeight, expected to be overwritten by solanaConnection.sendAndConfirmTx to prevent expired blockhash */
export const createTx = (opts: CreateTxOptions): Transaction => {
  return new Transaction({ ...opts, blockhash: "", lastValidBlockHeight: 0 });
};
