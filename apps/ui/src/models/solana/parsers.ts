import type {
  Mint as SplMint,
  Account as SplTokenAccount,
} from "@solana/spl-token";
import { AccountLayout, MintLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export type TokenAccount = Pick<SplTokenAccount, "address" | "amount" | "mint">;
export type Mint = Pick<SplMint, "address" | "supply">;

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
