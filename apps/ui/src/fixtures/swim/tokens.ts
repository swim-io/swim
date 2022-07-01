import { Env, findTokenById } from "../../config";

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
export const BNB_USDT = findTokenById("localnet-bnb-usdt", Env.Localnet);
export const BNB_BUSD = findTokenById("localnet-bnb-busd", Env.Localnet);
export const SOLANA_LP_HEXAPOOL = findTokenById(
  "localnet-solana-lp-hexapool",
  Env.Localnet,
);
