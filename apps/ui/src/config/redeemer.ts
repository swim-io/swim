import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

export interface RedeemerSpec {
  readonly id: string;
  readonly mintToTokenAccount: ReadonlyMap<string, string>;
}

const mainnetRedeemer: readonly RedeemerSpec[] = [];

const devnetRedeemer: readonly RedeemerSpec[] = [
  {
    id: "Gn4eV6vJJ3vzi2y8ANoKAhiEJT6YimdSxBpn8r1nioq5",
    mintToTokenAccount: new Map([
      [
        "Fh2GmZShyX16LhABEYbd3i1f7fa8CBpLw6eyFEDQ1XkU",
        "HDiJt8KK7qHZhkkyRyv6TTWzbEppCrpGZQ4YE5igarYu",
      ],
    ]),
  },
];

const localnetRedeemer: readonly RedeemerSpec[] = [];

export const redeemers: ReadonlyRecord<Env, readonly RedeemerSpec[]> = {
  [Env.Mainnet]: mainnetRedeemer,
  [Env.Devnet]: devnetRedeemer,
  [Env.Localnet]: localnetRedeemer,
  [Env.CustomLocalnet]: localnetRedeemer,
};
