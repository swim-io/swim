import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

import type { TokenAccount } from "../serialization";

export const findTokenAccountForMint = (
  mintAddress: string,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): TokenAccount | null => {
  const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(walletAddress),
  );
  return (
    splTokenAccounts.find(
      (tokenAccount) =>
        tokenAccount.mint.toBase58() === mintAddress &&
        tokenAccount.address.toBase58() ===
          associatedTokenAccountAddress.toBase58(),
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
