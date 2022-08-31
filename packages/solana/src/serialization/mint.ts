import type { Mint as SplMint } from "@solana/spl-token";
import { MintLayout } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";

/** Mint and RawMint from @solana/spl-token are non-overlapping types so we pick a subset of properties, plus the address */
export type Mint = Pick<
  SplMint,
  "address" | "decimals" | "isInitialized" | "mintAuthority" | "supply"
>;

export const deserializeMint = (pubkey: PublicKey, data: Buffer): Mint => {
  const decoded = MintLayout.decode(data);
  return {
    ...decoded,
    address: pubkey,
  };
};
