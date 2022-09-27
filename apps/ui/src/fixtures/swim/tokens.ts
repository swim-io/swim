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

// Testnet
export const SOLANA_USDC_TESTNET = findTokenById(
  "testnet-solana-usdc",
  Env.Testnet,
);
export const SOLANA_USDT_TESTNET = findTokenById(
  "testnet-solana-usdt",
  Env.Testnet,
);

export const ETHEREUM_USDC_TESTNET = findTokenById(
  "testnet-ethereum-usdc",
  Env.Testnet,
);
export const ETHEREUM_USDT_TESTNET = findTokenById(
  "testnet-ethereum-usdt",
  Env.Testnet,
);

export const SWIMUSD_TESTNET = findTokenById("testnet-swimusd", Env.Testnet);
