import type { TokenSpec } from "../../config";
import { Env, tokens } from "../../config";

export const findTokenById = (tokenId: string, env: Env): TokenSpec =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  tokens[env].find(({ id }) => id === tokenId)!;

export const SOLANA_USDC = findTokenById("localnet-solana-usdc", Env.Localnet);
export const SOLANA_USDT = findTokenById("localnet-solana-usdt", Env.Localnet);
export const ETHEREUM_USDC = findTokenById(
  "localnet-ethereum-usdc",
  Env.Localnet,
);
export const ETHEREUM_USDT = findTokenById(
  "localnet-ethereum-usdt",
  Env.Localnet,
);
export const BSC_USDT = findTokenById("localnet-bsc-usdt", Env.Localnet);
export const BSC_BUSD = findTokenById("localnet-bsc-busd", Env.Localnet);
export const SOLANA_LP_HEXAPOOL = findTokenById(
  "localnet-solana-lp-hexapool",
  Env.Localnet,
);
