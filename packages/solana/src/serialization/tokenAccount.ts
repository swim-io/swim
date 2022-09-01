import type { Account as SplTokenAccount } from "@solana/spl-token";
import { AccountLayout } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";

/** Account and RawAccount from @solana/spl-token are non-overlapping types so we pick a subset of properties, plus the address */
export type TokenAccount = Pick<
  SplTokenAccount,
  "address" | "amount" | "delegate" | "delegatedAmount" | "mint" | "owner"
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
