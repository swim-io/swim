import { PublicKey } from "@solana/web3.js";

import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

export interface RedeemerSpec {
  readonly programAddress: PublicKey;
  readonly programPDA: PublicKey;
  readonly nftCollection: PublicKey;
  readonly vaultMint: PublicKey;
  readonly vaultTokenAccount: PublicKey;
  readonly redemptionAmount: number;
}

const mainnetRedeemer: readonly RedeemerSpec[] = [];

const devnetRedeemer: readonly RedeemerSpec[] = [
  {
    programAddress: new PublicKey(
      "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
    ),
    programPDA: new PublicKey("2znJvHcqpqVuP6aX6at386Z3dhtgBbjL1ix5oDpZzNfi"),
    nftCollection: new PublicKey(
      "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    ),
    vaultMint: new PublicKey("A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF"),
    vaultTokenAccount: new PublicKey(
      "tJQbYYmxKqzqaswHrq8Mg7ZqmB9DNhs35SKdsEKABo9",
    ),
    redemptionAmount: 3000,
  },
];

const localnetRedeemer: readonly RedeemerSpec[] = [];

export const redeemers: ReadonlyRecord<Env, readonly RedeemerSpec[]> = {
  [Env.Mainnet]: mainnetRedeemer,
  [Env.Devnet]: devnetRedeemer,
  [Env.Localnet]: localnetRedeemer,
  [Env.CustomLocalnet]: localnetRedeemer,
};
