import { Env } from "@swim-io/core-types";

import { findTokenById } from "../../config";

export const SOLANA_USDC = findTokenById("localnet-solana-usdc", Env.Local);
export const SOLANA_USDT = findTokenById("localnet-solana-usdt", Env.Local);
export const ETHEREUM_USDC = findTokenById("localnet-ethereum-usdc", Env.Local);
export const ETHEREUM_USDT = findTokenById("localnet-ethereum-usdt", Env.Local);
export const BNB_USDT = findTokenById("localnet-bnb-usdt", Env.Local);
export const BNB_BUSD = findTokenById("localnet-bnb-busd", Env.Local);
export const SOLANA_LP_HEXAPOOL = findTokenById(
  "localnet-solana-lp-hexapool",
  Env.Local,
);
