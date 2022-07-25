import Decimal from "decimal.js";

import { EcosystemId, Env } from "../../config";
import { Amount, InteractionType, SwapType } from "../../models";
import type {
  AddInteraction,
  AddInteractionState,
  CrossChainEvmSwapInteractionState,
  CrossChainEvmToSolanaSwapInteractionState,
  CrossChainSolanaToEvmSwapInteractionState,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveInteractionState,
  RemoveUniformInteraction,
  RequiredSplTokenAccounts,
  SingleChainEvmSwapInteractionState,
  SingleChainSolanaSwapInteractionState,
  SwapInteractionV2,
} from "../../models";

import {
  ETHEREUM_USDC_DEVNET,
  ETHEREUM_USDT_DEVNET,
  SOLANA_USDC_DEVNET,
  SOLANA_USDT_DEVNET,
  SWIMUSD_DEVNET,
} from "./tokens";

export const SINGLE_CHAIN_SOLANA_INTERACTION: SwapInteractionV2 = {
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
    txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK9",
  },
};

export const SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT: SingleChainSolanaSwapInteractionState =
  {
    interaction: SINGLE_CHAIN_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    onChainSwapTxId: null,
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
    onChainSwapTxId:
      "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
  };

const SINGLE_CHAIN_EVM_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenDetail: {
      tokenId: "devnet-ethereum-usdc",
      ecosystemId: EcosystemId.Ethereum,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-ethereum-usdt",
      ecosystemId: EcosystemId.Ethereum,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: null,
    [EcosystemId.Bnb]: null,
    [EcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
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
      ecosystemId: EcosystemId.Ethereum,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-bnb-usdt",
      ecosystemId: EcosystemId.Bnb,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: null,
    [EcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
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
      ecosystemId: EcosystemId.Solana,
      value: new Decimal("100"),
    },
    toTokenDetail: {
      tokenId: "devnet-bnb-usdt",
      ecosystemId: EcosystemId.Bnb,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EcosystemId.Ethereum]: null,
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
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
      ecosystemId: EcosystemId.Bnb,
      value: new Decimal("101"),
    },
    toTokenDetail: {
      tokenId: "devnet-solana-usdc",
      ecosystemId: EcosystemId.Solana,
      value: new Decimal("100"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt", "devnet-bnb-busd-usdt"],
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EcosystemId.Ethereum]: null,
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
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

const ADD_INTERACTION_SOLANA: AddInteraction = {
  type: InteractionType.Add,
  params: {
    inputAmounts: [
      Amount.fromHumanString(SOLANA_USDC_DEVNET, "5"),
      Amount.fromHumanString(SOLANA_USDT_DEVNET, "5"),
    ],
    minimumMintAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt"], // TODO remove from type?
  poolId: "devnet-solana-usdc-usdt",
  lpTokenTargetEcosystem: EcosystemId.Solana,
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

export const ADD_INTERACTION_STATE_SOLANA_INIT: AddInteractionState = {
  interaction: ADD_INTERACTION_SOLANA,
  interactionType: InteractionType.Add,
  requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
  approvalTxIds: [],
  addTxId: null,
};

export const ADD_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS: AddInteractionState =
  {
    ...ADD_INTERACTION_STATE_SOLANA_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
  };

export const ADD_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS: AddInteractionState =
  {
    ...ADD_INTERACTION_STATE_SOLANA_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
  };

export const ADD_INTERACTION_STATE_SOLANA_COMPLETED: AddInteractionState = {
  ...ADD_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
  addTxId: "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
};

export const ADD_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS: AddInteractionState =
  {
    ...ADD_INTERACTION_STATE_SOLANA_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const ADD_INTERACTION_EVM: AddInteraction = {
  type: InteractionType.Add,
  params: {
    inputAmounts: [
      Amount.fromHumanString(ETHEREUM_USDC_DEVNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_DEVNET, "5"),
    ],
    minimumMintAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt"], // TODO remove from type?
  poolId: "devnet-ethereum-usdc-usdt",
  lpTokenTargetEcosystem: EcosystemId.Ethereum,
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: null,
    [EcosystemId.Bnb]: null,
    [EcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
  },
};

export const ADD_INTERACTION_STATE_ETHEREUM_INIT: AddInteractionState = {
  interaction: ADD_INTERACTION_EVM,
  interactionType: InteractionType.Add,
  requiredSplTokenAccounts: null,
  approvalTxIds: [],
  addTxId: null,
};

export const ADD_INTERACTION_STATE_ETHEREUM_COMPLETED: AddInteractionState = {
  ...ADD_INTERACTION_STATE_ETHEREUM_INIT,
  addTxId: "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
};

export const ADD_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS: AddInteractionState =
  {
    ...ADD_INTERACTION_STATE_ETHEREUM_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const REMOVE_INTERACTION_SOLANA: RemoveUniformInteraction = {
  type: InteractionType.RemoveUniform,
  params: {
    minimumOutputAmounts: [
      Amount.fromHumanString(SOLANA_USDC_DEVNET, "5"),
      Amount.fromHumanString(SOLANA_USDT_DEVNET, "5"),
    ],
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-solana-usdc-usdt"], // TODO remove from type?
  poolId: "devnet-solana-usdc-usdt",
  lpTokenSourceEcosystem: EcosystemId.Solana,
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

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT: RemoveInteractionState =
  {
    interaction: REMOVE_INTERACTION_SOLANA,
    interactionType: InteractionType.RemoveUniform,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    approvalTxIds: [],
    removeTxId: null,
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_EXISTING_SPL_TOKEN_ACCOUNTS: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_EXISTING,
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_CREATED,
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_CREATED_SPL_TOKEN_ACCOUNTS,
    removeTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED_WITH_APPROVALS: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const REMOVE_UNIFORM_INTERACTION_ETHEREUM: RemoveUniformInteraction = {
  type: InteractionType.RemoveUniform,
  params: {
    minimumOutputAmounts: [
      Amount.fromHumanString(ETHEREUM_USDC_DEVNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_DEVNET, "5"),
    ],
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["devnet-ethereum-usdc-usdt"], // TODO remove from type?
  poolId: "devnet-ethereum-usdc-usdt",
  lpTokenSourceEcosystem: EcosystemId.Solana,
  env: Env.Devnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [EcosystemId.Solana]: null,
    [EcosystemId.Bnb]: null,
    [EcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EcosystemId.Acala]: null,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Polygon]: null,
  },
};

export const REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    interaction: REMOVE_UNIFORM_INTERACTION_ETHEREUM,
    interactionType: InteractionType.RemoveUniform,
    requiredSplTokenAccounts: null,
    approvalTxIds: [],
    removeTxId: null,
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_INIT,
    removeTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS: RemoveInteractionState =
  {
    ...REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const REMOVE_EXACT_BURN_INTERACTION_ETHEREUM: RemoveExactBurnInteraction = {
  ...REMOVE_UNIFORM_INTERACTION_ETHEREUM,
  type: InteractionType.RemoveExactBurn,
  params: {
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
    minimumOutputAmount: Amount.fromHumanString(ETHEREUM_USDC_DEVNET, "10"),
  },
};

export const REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    interaction: REMOVE_EXACT_BURN_INTERACTION_ETHEREUM,
    interactionType: InteractionType.RemoveExactBurn,
    requiredSplTokenAccounts: null,
    approvalTxIds: [],
    removeTxId: null,
  };

export const REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED: RemoveInteractionState =
  {
    ...REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_INIT,
    removeTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS: RemoveInteractionState =
  {
    ...REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };

const REMOVE_EXACT_OUTPUT_INTERACTION_ETHEREUM: RemoveExactOutputInteraction = {
  ...REMOVE_UNIFORM_INTERACTION_ETHEREUM,
  type: InteractionType.RemoveExactOutput,
  params: {
    maximumBurnAmount: Amount.fromHumanString(SWIMUSD_DEVNET, "10"),
    exactOutputAmounts: [
      Amount.fromHumanString(ETHEREUM_USDC_DEVNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_DEVNET, "5"),
    ],
  },
};

export const REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    interaction: REMOVE_EXACT_OUTPUT_INTERACTION_ETHEREUM,
    interactionType: InteractionType.RemoveExactOutput,
    requiredSplTokenAccounts: null,
    approvalTxIds: [],
    removeTxId: null,
  };

export const REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED: RemoveInteractionState =
  {
    ...REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_INIT,
    removeTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED_WITH_APPROVALS: RemoveInteractionState =
  {
    ...REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_COMPLETED,
    approvalTxIds: [
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
    ],
  };
