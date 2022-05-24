import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

// Probably makes some incorrect assumptions..
export interface RedeemerSpec {
  readonly id: string;
  readonly mint: string;
  readonly collection: string;
}

const mainnetRedeemer: readonly RedeemerSpec[] = [];

// should these just be public keys?
const devnetRedeemer: readonly RedeemerSpec[] = [
  {
    id: "Gn4eV6vJJ3vzi2y8ANoKAhiEJT6YimdSxBpn8r1nioq5",
    mint: "Fh2GmZShyX16LhABEYbd3i1f7fa8CBpLw6eyFEDQ1XkU",
    collection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
  },
];

const localnetRedeemer: readonly RedeemerSpec[] = [];

export const redeemers: ReadonlyRecord<Env, readonly RedeemerSpec[]> = {
  [Env.Mainnet]: mainnetRedeemer,
  [Env.Devnet]: devnetRedeemer,
  [Env.Localnet]: localnetRedeemer,
  [Env.CustomLocalnet]: localnetRedeemer,
};
