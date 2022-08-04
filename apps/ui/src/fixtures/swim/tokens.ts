import { Env } from "@swim-io/core";

import { findTokenById } from "../../config";

export const SOLANA_USDC = findTokenById("local-solana-usdc", Env.Local);
export const SOLANA_USDT = findTokenById("local-solana-usdt", Env.Local);
export const ETHEREUM_USDC = findTokenById("local-ethereum-usdc", Env.Local);
export const ETHEREUM_USDT = findTokenById("local-ethereum-usdt", Env.Local);
export const BNB_USDT = findTokenById("local-bnb-usdt", Env.Local);
export const BNB_BUSD = findTokenById("local-bnb-busd", Env.Local);
export const SOLANA_LP_HEXAPOOL = findTokenById(
  "local-solana-lp-hexapool",
  Env.Local,
);

// Devnet
export const SOLANA_USDC_DEVNET = findTokenById(
  "devnet-solana-usdc",
  Env.Devnet,
);
export const SOLANA_USDT_DEVNET = findTokenById(
  "devnet-solana-usdt",
  Env.Devnet,
);

export const ETHEREUM_USDC_DEVNET = findTokenById(
  "devnet-ethereum-usdc",
  Env.Devnet,
);
export const ETHEREUM_USDT_DEVNET = findTokenById(
  "devnet-ethereum-usdt",
  Env.Devnet,
);

export const SWIMUSD_DEVNET = findTokenById("devnet-swimusd", Env.Devnet);
