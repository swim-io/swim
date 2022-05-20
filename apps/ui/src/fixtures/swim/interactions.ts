import Decimal from "decimal.js";

import { EcosystemId, Env } from "../../config";
import type { AddInteraction, SwapInteraction } from "../../models";
import { Amount, InteractionType } from "../../models";
import { findLocalnetTokenById } from "../../testUtils";

const SOLANA_USDC = findLocalnetTokenById("localnet-solana-usdc");
const SOLANA_USDT = findLocalnetTokenById("localnet-solana-usdt");
const ETHEREUM_USDC = findLocalnetTokenById("localnet-ethereum-usdc");
const ETHEREUM_USDT = findLocalnetTokenById("localnet-ethereum-usdt");
const BSC_USDT = findLocalnetTokenById("localnet-bsc-usdt");
const BSC_BUSD = findLocalnetTokenById("localnet-bsc-busd");
const SOLANA_LP_HEXAPOOL = findLocalnetTokenById("localnet-solana-lp-hexapool");

export const ETH_USDC_TO_SOL_USDC_SWAP: SwapInteraction = {
  type: InteractionType.Swap,
  params: {
    exactInputAmount: Amount.fromHuman(ETHEREUM_USDC, new Decimal(1001)),
    minimumOutputAmount: Amount.fromHuman(SOLANA_USDC, new Decimal(995.624615)),
  },
  id: "05c0e3ea832571ae4c64e80b2e2a12f9",
  poolIds: ["hexapool"],
  env: Env.CustomLocalnet,
  submittedAt: 1652947628411,
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {},
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: null,
    terra: null,
    avalanche: null,
    polygon: null,
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
  env: Env.CustomLocalnet,
  submittedAt: 1652947575631,
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {},
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: null,
    terra: null,
    avalanche: null,
    polygon: null,
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
  env: Env.CustomLocalnet,
  submittedAt: 1652947560467,
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {},
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: null,
    bsc: null,
    terra: null,
    avalanche: null,
    polygon: null,
  },
};

export const BSC_USDT_TO_ETH_USDC_SWAP: SwapInteraction = {
  type: 0,
  params: {
    exactInputAmount: Amount.fromHuman(BSC_USDT, new Decimal(1000)),
    minimumOutputAmount: Amount.fromHuman(
      ETHEREUM_USDC,
      new Decimal(994.574014),
    ),
  },
  id: "1e8cdbbb60f72e02f99e3c81f447b0a8",
  poolIds: ["hexapool"],
  env: Env.CustomLocalnet,
  submittedAt: 1652947575631,
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {},
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    terra: null,
    avalanche: null,
    polygon: null,
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
      Amount.fromHuman(BSC_BUSD, new Decimal(1000)),
      Amount.fromHuman(BSC_USDT, new Decimal(1000)),
    ].reduce((map, amount) => map.set(amount.tokenId, amount), new Map()),
    minimumMintAmount: Amount.fromHuman(
      SOLANA_LP_HEXAPOOL,
      new Decimal(5969.99730442),
    ),
  },
  lpTokenTargetEcosystem: EcosystemId.Solana,
  id: "b8b3e6b61df832c9815467f5fdc1fd6b",
  poolIds: ["hexapool"],
  env: Env.CustomLocalnet,
  submittedAt: 1653063505510,
  signatureSetKeypairs: {},
  previousSignatureSetAddresses: {
    "localnet-ethereum-usdc": "8UyNfs7acAQ4y1tQUxoZnCwT6Dd6N2B3XU65QnHuVpWV",
    "localnet-ethereum-usdt": "65riF9tEWgkZKsW4UyWSW8QgiYrb54WH4nDeqSfVen21",
    "localnet-bsc-busd": "DSbWZFFfArz2366vWfZjrDowVPgpctKzh3F5JkHoN1iH",
    "localnet-bsc-usdt": "BAdRWFGBavu9qB5kpY336Z4ATvwqRo5xeAbNNcJUwZAb",
  },
  connectedWallets: {
    solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    ethereum: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    bsc: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
    terra: null,
    avalanche: null,
    polygon: null,
  },
};

export const SWAP_INTERACTIONS = [
  ETH_USDC_TO_SOL_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
  SOL_USDC_TO_ETH_USDC_SWAP,
];
