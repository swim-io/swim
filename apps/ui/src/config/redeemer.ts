import { Env } from "@swim-io/core";

import type { ReadonlyRecord } from "../utils";

export interface RedeemerSpec {
  readonly programAddress: string;
  readonly programPda: string;
  readonly nftCollection: string;
  readonly vaultMint: string;
  readonly vaultTokenAccount: string;
}

// TODO: Setup Redeemer on mainnet.
const MAINNET_REDEEMER: RedeemerSpec = {
  programAddress: "",
  programPda: "",
  nftCollection: "",
  vaultMint: "",
  vaultTokenAccount: "",
};

const DEVNET_REDEEMER: RedeemerSpec = {
  programAddress: "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
  programPda: "2znJvHcqpqVuP6aX6at386Z3dhtgBbjL1ix5oDpZzNfi",
  nftCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
  vaultMint: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
  vaultTokenAccount: "tJQbYYmxKqzqaswHrq8Mg7ZqmB9DNhs35SKdsEKABo9",
};

// TODO: Setup Redeemer on teamnet.
const LOCAL_REDEEMER: RedeemerSpec = {
  programAddress: "",
  programPda: "",
  nftCollection: "",
  vaultMint: "",
  vaultTokenAccount: "",
};

export const REDEEMER: ReadonlyRecord<Env, RedeemerSpec> = {
  [Env.Mainnet]: MAINNET_REDEEMER,
  [Env.Devnet]: DEVNET_REDEEMER,
  [Env.Local]: LOCAL_REDEEMER,
  [Env.Custom]: LOCAL_REDEEMER,
};
