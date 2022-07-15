import { Env } from "@swim-io/core-types";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import Decimal from "decimal.js";

import type { AddInteraction, SwapInteraction } from "../../models";
import { Amount, InteractionType } from "../../models";

import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_LP_HEXAPOOL,
  SOLANA_USDC,
  SOLANA_USDT,
} from "./tokens";

export const ETH_USDC_TO_SOL_USDC_SWAP: SwapInteraction = {
  type: InteractionType.Swap,
  params: {
    exactInputAmount: Amount.fromHuman(ETHEREUM_USDC, new Decimal(1001)),
    minimumOutputAmount: Amount.fromHuman(SOLANA_USDC, new Decimal(995.624615)),
  },
  id: "05c0e3ea832571ae4c64e80b2e2a12f9",
  poolIds: ["hexapool"],
  env: Env.Custom,
  submittedAt: 1652947628411,
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bnb: null,
    // avalanche: null,
    // polygon: null,
    // aurora: null,
    // fantom: null,
    // karura: null,
    // acala: null,
  },
};

export const SOL_USDC_TO_ETH_USDC_SWAP: SwapInteraction = {
  type: 0,
  params: {
    exactInputAmount: Amount.fromHuman(SOLANA_USDC, new Decimal(1000)),
    minimumOutputAmount: Amount.fromHuman(
      ETHEREUM_USDC,
      new Decimal(994.574014),
    ),
  },
  id: "0e9cdbbb60f72e02f99e3c81f447b0a8",
  poolIds: ["hexapool"],
  env: Env.Custom,
  submittedAt: 1652947575631,
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bnb: null,
    // avalanche: null,
    // polygon: null,
    // aurora: null,
    // fantom: null,
    // karura: null,
    // acala: null,
  },
};

export const SOL_USDC_TO_SOL_USDT_SWAP: SwapInteraction = {
  type: 0,
  params: {
    exactInputAmount: Amount.fromHuman(SOLANA_USDC, new Decimal(9999)),
    minimumOutputAmount: Amount.fromHuman(
      SOLANA_USDT,
      new Decimal(9944.839927),
    ),
  },
  id: "53e03b0127787c2ff0c9d6df1ed75a94",
  poolIds: ["hexapool"],
  env: Env.Custom,
  submittedAt: 1652947560467,
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: null,
    bnb: null,
    // avalanche: null,
    // polygon: null,
    // aurora: null,
    // fantom: null,
    // karura: null,
    // acala: null,
  },
};

export const BNB_USDT_TO_ETH_USDC_SWAP: SwapInteraction = {
  type: 0,
  params: {
    exactInputAmount: Amount.fromHuman(BNB_USDT, new Decimal(1000)),
    minimumOutputAmount: Amount.fromHuman(
      ETHEREUM_USDC,
      new Decimal(994.574014),
    ),
  },
  id: "1e8cdbbb60f72e02f99e3c81f447b0a8",
  poolIds: ["hexapool"],
  env: Env.Custom,
  submittedAt: 1652947575631,
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bnb: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    // avalanche: null,
    // polygon: null,
    // aurora: null,
    // fantom: null,
    // karura: null,
    // acala: null,
  },
};

export const ADD: AddInteraction = {
  type: 1,
  poolId: "hexapool",
  params: {
    inputAmounts: [
      Amount.fromHuman(SOLANA_USDC, new Decimal(1000)),
      Amount.fromHuman(SOLANA_USDT, new Decimal(1000)),
      Amount.fromHuman(ETHEREUM_USDC, new Decimal(1000)),
      Amount.fromHuman(ETHEREUM_USDT, new Decimal(1000)),
      Amount.fromHuman(BNB_BUSD, new Decimal(1000)),
      Amount.fromHuman(BNB_USDT, new Decimal(1000)),
    ],
    minimumMintAmount: Amount.fromHuman(
      SOLANA_LP_HEXAPOOL,
      new Decimal(5969.99730442),
    ),
  },
  lpTokenTargetEcosystem: SOLANA_ECOSYSTEM_ID,
  id: "b8b3e6b61df832c9815467f5fdc1fd6b",
  poolIds: ["hexapool"],
  env: Env.Custom,
  submittedAt: 1653063505510,
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bnb: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    // avalanche: null,
    // polygon: null,
    // aurora: null,
    // fantom: null,
    // karura: null,
    // acala: null,
  },
};

export const SWAP_INTERACTIONS = [
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
];
