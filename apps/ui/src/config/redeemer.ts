import { PublicKey } from "@solana/web3.js";

import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

export interface RedeemerSpec {
  readonly id: PublicKey;
  readonly mint: PublicKey;
  readonly collection: PublicKey;
  readonly amount: number;
}

const mainnetRedeemer: readonly RedeemerSpec[] = [];

const devnetRedeemer: readonly RedeemerSpec[] = [
  {
    id: new PublicKey("Gn4eV6vJJ3vzi2y8ANoKAhiEJT6YimdSxBpn8r1nioq5"),
    // TODO: Use TokenSpec from config/token.ts
    mint: new PublicKey("Fh2GmZShyX16LhABEYbd3i1f7fa8CBpLw6eyFEDQ1XkU"),
    collection: new PublicKey("EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s"),
    amount: 3000,
  },
];

const localnetRedeemer: readonly RedeemerSpec[] = [];

export const redeemers: ReadonlyRecord<Env, readonly RedeemerSpec[]> = {
  [Env.Mainnet]: mainnetRedeemer,
  [Env.Devnet]: devnetRedeemer,
  [Env.Localnet]: localnetRedeemer,
  [Env.CustomLocalnet]: localnetRedeemer,
};
