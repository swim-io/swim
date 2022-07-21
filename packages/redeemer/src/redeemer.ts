import { Env } from "@swim-io/core-types";

export interface RedeemerConfig {
  readonly programAddress: string;
  readonly programPda: string;
  readonly nftCollection: string;
  readonly vaultMint: string;
  readonly vaultTokenAccount: string;
}

const devnet: RedeemerConfig = {
  programAddress: "7frYsb48TdaenQpmVxRHgMnNL861aK1aeq6aTkVrUkDt",
  programPda: "2znJvHcqpqVuP6aX6at386Z3dhtgBbjL1ix5oDpZzNfi",
  nftCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
  vaultMint: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
  vaultTokenAccount: "tJQbYYmxKqzqaswHrq8Mg7ZqmB9DNhs35SKdsEKABo9",
};

export const redeemerConfigs: ReadonlyMap<Env, RedeemerConfig> = new Map([
  [Env.Devnet, devnet],
]);
