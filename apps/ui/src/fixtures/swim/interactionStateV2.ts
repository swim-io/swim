import { Env } from "@swim-io/core-types";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import Decimal from "decimal.js";

import { Amount, InteractionType, SwapType } from "../../models";
import type {
  CrossChainEvmSwapInteractionState,
  CrossChainEvmToSolanaSwapInteractionState,
  CrossChainSolanaToEvmSwapInteractionState,
  RequiredSplTokenAccounts,
  SingleChainEvmSwapInteractionState,
  SingleChainSolanaSwapInteractionState,
  SolanaPoolOperationState,
  SwapInteractionV2,
} from "../../models";

import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "./tokens";

export const SINGLE_CHAIN_SOLANA_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-solana-usdc",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-solana-usdt",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [BNB_ECOSYSTEM_ID]: null,
    [ETHEREUM_ECOSYSTEM_ID]: null,
    // [EcosystemId.Acala]: null,
    // [EcosystemId.Aurora]: null,
    // [EcosystemId.Avalanche]: null,
    // [EcosystemId.Fantom]: null,
    // [EcosystemId.Karura]: null,
    // [EcosystemId.Polygon]: null,
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

export const SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_INIT,
  };

export const SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS: SingleChainSolanaSwapInteractionState =
  {
    ...SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
  };

export const SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS: SingleChainSolanaSwapInteractionState =
  {
    ...SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
  };

export const SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED: SingleChainSolanaSwapInteractionState =
  {
    ...SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
    solanaPoolOperations: SOLANA_POOLS_OPERATIONS_COMPLETED,
  };

const SINGLE_CHAIN_EVM_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-ethereum-usdc",
      ecosystemId: ETHEREUM_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-ethereum-usdt",
      ecosystemId: ETHEREUM_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [SOLANA_ECOSYSTEM_ID]: null,
    [BNB_ECOSYSTEM_ID]: null,
    [ETHEREUM_ECOSYSTEM_ID]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    // [EcosystemId.Acala]: null,
    // [EcosystemId.Aurora]: null,
    // [EcosystemId.Avalanche]: null,
    // [EcosystemId.Fantom]: null,
    // [EcosystemId.Karura]: null,
    // [EcosystemId.Polygon]: null,
  },
};

export const SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT: SingleChainEvmSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_EVM_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainEvm,
    approvalTxIds: [],
    onChainSwapTxId: null,
  };

export const SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED: SingleChainEvmSwapInteractionState =
  {
    ...SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
    onChainSwapTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
  };

export const SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPETED_WITH_APPROVALS: SingleChainEvmSwapInteractionState =
  {
    ...SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const CROSS_CHAIN_EVM_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-ethereum-usdc",
      ecosystemId: ETHEREUM_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-bnb-usdt",
      ecosystemId: BNB_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [SOLANA_ECOSYSTEM_ID]: null,
    [BNB_ECOSYSTEM_ID]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [ETHEREUM_ECOSYSTEM_ID]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    // [EcosystemId.Acala]: null,
    // [EcosystemId.Aurora]: null,
    // [EcosystemId.Avalanche]: null,
    // [EcosystemId.Fantom]: null,
    // [EcosystemId.Karura]: null,
    // [EcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT: CrossChainEvmSwapInteractionState =
  {
    interaction: CROSS_CHAIN_EVM_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainEvmToEvm,
    approvalTxIds: [],
    swapAndTransferTxId: null,
    receiveAndSwapTxId: null,
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER: CrossChainEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId: null,
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED: CrossChainEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED_WITH_APPROVALS: CrossChainEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    ],
  };

const CROSS_CHAIN_SOLANA_TO_EVM_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-solana-usdc",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-bnb-usdt",
      ecosystemId: BNB_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [BNB_ECOSYSTEM_ID]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [ETHEREUM_ECOSYSTEM_ID]: null,
    // [EcosystemId.Acala]: null,
    // [EcosystemId.Aurora]: null,
    // [EcosystemId.Avalanche]: null,
    // [EcosystemId.Fantom]: null,
    // [EcosystemId.Karura]: null,
    // [EcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT: CrossChainSolanaToEvmSwapInteractionState =
  {
    interaction: CROSS_CHAIN_SOLANA_TO_EVM_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainSolanaToEvm,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    swapAndTransferTxId: null,
    receiveAndSwapTxId: null,
  };

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS: CrossChainSolanaToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
  };

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS: CrossChainSolanaToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
  };

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED: CrossChainSolanaToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
  };

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_COMPLETED: CrossChainSolanaToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
  };

const CROSS_CHAIN_EVM_TO_SOLANA_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-bnb-usdt",
      ecosystemId: BNB_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
    toTokenDetail: {
      tokenId: "devnet-solana-usdc",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [BNB_ECOSYSTEM_ID]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [ETHEREUM_ECOSYSTEM_ID]: null,
    // [EcosystemId.Acala]: null,
    // [EcosystemId.Aurora]: null,
    // [EcosystemId.Avalanche]: null,
    // [EcosystemId.Fantom]: null,
    // [EcosystemId.Karura]: null,
    // [EcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT: CrossChainEvmToSolanaSwapInteractionState =
  {
    interaction: CROSS_CHAIN_EVM_TO_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainEvmToSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    approvalTxIds: [],
    swapAndTransferTxId: null,
    postVaaOnSolanaTxIds: [],
    claimTokenOnSolanaTxId: null,
  };

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_EXISTING_SPL_TOKEN_ACCOUNTS: CrossChainEvmToSolanaSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
  };

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS: CrossChainEvmToSolanaSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
  };

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED: CrossChainEvmToSolanaSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_CREATED_SPL_TOKEN_ACCOUNTS,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
  };

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_POST_VAA_COMPLETED: CrossChainEvmToSolanaSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
    postVaaOnSolanaTxIds: [
      "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
      "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK9",
    ],
  };

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_COMPLETED: CrossChainEvmToSolanaSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_POST_VAA_COMPLETED,
    claimTokenOnSolanaTxId:
      "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
  };
