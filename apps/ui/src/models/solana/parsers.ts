import type {
  Mint as SplMint,
  Account as SplTokenAccount,
} from "@solana/spl-token";
import { AccountLayout, MintLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

/** Account and RawAccount from @solana/spl-token are non-overlapping types so we pick a subset of properties, plus the address */
export type TokenAccount = Pick<
  SplTokenAccount,
  "address" | "amount" | "delegate" | "delegatedAmount" | "mint" | "owner"
>;
/** Mint and RawMint from @solana/spl-token are non-overlapping types so we pick a subset of properties, plus the address */
export type Mint = Pick<
  SplMint,
  "address" | "decimals" | "isInitialized" | "mintAuthority" | "supply"
>;

export const deserializeTokenAccount = (
  pubkey: PublicKey,
  data: Buffer,
): TokenAccount => {
  const decoded = AccountLayout.decode(data);
  return {
    ...decoded,
    address: pubkey,
  };
};

export const deserializeMint = (pubkey: PublicKey, data: Buffer): Mint => {
  const decoded = MintLayout.decode(data);
  return {
    ...decoded,
    address: pubkey,
  };
};
