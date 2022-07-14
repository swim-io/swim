import Decimal from "decimal.js";

import { EcosystemId, Env } from "../../config";
import { Amount, InteractionType } from "../../models";
import type {
  InteractionV2,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
} from "../../models";
import type { SingleChainSolanaSwapInteractionState } from "../../models/swim/interactionStateV2";
import { SwapType } from "../../models/swim/interactionStateV2";

import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "./tokens";

const SINGLE_CHAIN_SOLANA_INTERACTION: InteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-solana-usdc",
      ecosystemId: EcosystemId.Solana,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-solana-usdt",
      ecosystemId: EcosystemId.Solana,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EcosystemId.Bnb]: null,
    [EcosystemId.Ethereum]: null,
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
  },
};

const SPL_TOKEN_ACCOUNTS_INIT: RequiredSplTokenAccounts = {
  "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
    isExistingAccount: false,
    txId: null,
  },
  Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
    isExistingAccount: false,
    txId: null,
  },
};

const SPL_TOKEN_ACCOUNTS_EXISTING: RequiredSplTokenAccounts = {
  "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
    isExistingAccount: true,
    txId: null,
  },
  Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
    isExistingAccount: true,
    txId: null,
  },
};

const SPL_TOKEN_ACCOUNTS_CREATED: RequiredSplTokenAccounts = {
  "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
    isExistingAccount: false,
    txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
  },
  Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
    isExistingAccount: false,
    txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
  },
};

const SOLANA_POOLS_OPERATIONS_INIT: readonly SolanaPoolOperationState[] = [
  {
    // TODO OperationSpec needs to be updated?
    operation: {
      interactionId: "2eed9eef597a2aa14314845afe87079f",
      poolId: "devnet-solana-usdc-usdt",
      instruction: 1,
      params: {
        exactInputAmounts: [
          Amount.fromHumanString(SOLANA_USDC, "0"),
          Amount.fromHumanString(SOLANA_USDT, "0"),
          Amount.fromHumanString(ETHEREUM_USDC, "0"),
          Amount.fromHumanString(ETHEREUM_USDT, "0"),
          Amount.fromHumanString(BNB_BUSD, "0"),
          Amount.fromHumanString(BNB_USDT, "1001"),
        ],
        outputTokenIndex: 2,
        minimumOutputAmount: Amount.fromHumanString(
          ETHEREUM_USDC,
          "995.624615",
        ),
      },
    },
    txId: null,
  },
];

const SOLANA_POOLS_OPERATIONS_COMPLETED: readonly SolanaPoolOperationState[] = [
  {
    ...SOLANA_POOLS_OPERATIONS_INIT[0],
    txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
  },
];

export const MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_INIT,
  };

export const MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_INIT,
  };

export const MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_INIT,
  };

export const MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_COMPLETED,
  };
