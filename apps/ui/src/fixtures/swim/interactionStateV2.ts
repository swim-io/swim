import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import Decimal from "decimal.js";

import { findTokenById } from "../../config";
import type { PersistedInteractionStateV2 } from "../../core/store/idb/helpers";
import { Amount, InteractionType, SwapType } from "../../models";
import type {
  AddInteraction,
  AddInteractionState,
  CrossChainEvmToEvmSwapInteractionState,
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
  ETHEREUM_USDC_TESTNET,
  ETHEREUM_USDT_TESTNET,
  SOLANA_USDC_TESTNET,
  SOLANA_USDT_TESTNET,
  SWIMUSD_TESTNET,
} from "./tokens";

export const SINGLE_CHAIN_SOLANA_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenData: {
      tokenConfig: findTokenById("testnet-solana-usdc", Env.Testnet),
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenData: {
      tokenConfig: findTokenById("testnet-solana-usdt", Env.Testnet),
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-solana-usdc-usdt"],
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: null,
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
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
    version: 2,
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
    fromTokenData: {
      tokenConfig: findTokenById("testnet-ethereum-usdc", Env.Testnet),
      ecosystemId: EvmEcosystemId.Ethereum,
      value: new Decimal("100"),
    },
    toTokenData: {
      tokenConfig: findTokenById("testnet-ethereum-usdt", Env.Testnet),
      ecosystemId: EvmEcosystemId.Ethereum,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-ethereum-usdc-usdt"],
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: null,
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const SINGLE_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT: SingleChainEvmSwapInteractionState =
  {
    version: 2,
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
    fromTokenData: {
      tokenConfig: findTokenById("testnet-ethereum-usdc", Env.Testnet),
      ecosystemId: EvmEcosystemId.Ethereum,
      value: new Decimal("100"),
    },
    toTokenData: {
      tokenConfig: findTokenById("testnet-bnb-usdt", Env.Testnet),
      ecosystemId: EvmEcosystemId.Bnb,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-ethereum-usdc-usdt", "testnet-bnb-busd-usdt"],
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: null,
    [EvmEcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EvmEcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT: CrossChainEvmToEvmSwapInteractionState =
  {
    version: 2,
    interaction: CROSS_CHAIN_EVM_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainEvmToEvm,
    approvalTxIds: [],
    swapAndTransferTxId: null,
    receiveAndSwapTxId: null,
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER: CrossChainEvmToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId: null,
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED: CrossChainEvmToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_INIT,
    swapAndTransferTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7ca2",
  };

export const CROSS_CHAIN_EVM_SWAP_INTERACTION_STATE_COMPLETED_WITH_APPROVALS: CrossChainEvmToEvmSwapInteractionState =
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
    fromTokenData: {
      tokenConfig: findTokenById("testnet-solana-usdc", Env.Testnet),
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
    toTokenData: {
      tokenConfig: findTokenById("testnet-bnb-usdt", Env.Testnet),
      ecosystemId: EvmEcosystemId.Bnb,
      value: new Decimal("101"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-solana-usdc-usdt", "testnet-bnb-busd-usdt"],
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EvmEcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EvmEcosystemId.Ethereum]: null,
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_INIT: CrossChainSolanaToEvmSwapInteractionState =
  {
    version: 2,
    interaction: CROSS_CHAIN_SOLANA_TO_EVM_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainSolanaToEvm,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    swapToSwimUsdTxId: null,
    transferSwimUsdToEvmTxId: null,
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
    swapToSwimUsdTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
  };

export const CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_COMPLETED: CrossChainSolanaToEvmSwapInteractionState =
  {
    ...CROSS_CHAIN_SOLANA_TO_EVM_SWAP_INTERACTION_STATE_SWAP_AND_TRANSFER_COMPLETED,
    swapToSwimUsdTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7caa",
    receiveAndSwapTxId:
      "0x658875e6a68f242339bdf3db0f3a2f52274f6384ccdcf4a834b11f73996b7cab",
  };

const CROSS_CHAIN_EVM_TO_SOLANA_INTERACTION: SwapInteractionV2 = {
  type: InteractionType.SwapV2,
  params: {
    fromTokenData: {
      tokenConfig: findTokenById("testnet-bnb-usdt", Env.Testnet),
      ecosystemId: EvmEcosystemId.Bnb,
      value: new Decimal("101"),
    },
    toTokenData: {
      tokenConfig: findTokenById("testnet-solana-usdc", Env.Testnet),
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      value: new Decimal("100"),
    },
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-solana-usdc-usdt", "testnet-bnb-busd-usdt"],
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EvmEcosystemId.Bnb]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f1",
    [EvmEcosystemId.Ethereum]: null,
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const CROSS_CHAIN_EVM_TO_SOLANA_SWAP_INTERACTION_STATE_INIT: CrossChainEvmToSolanaSwapInteractionState =
  {
    version: 2,
    interaction: CROSS_CHAIN_EVM_TO_SOLANA_INTERACTION,
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.CrossChainEvmToSolana,
    requiredSplTokenAccounts: SPL_TOKEN_ACCOUNTS_INIT,
    approvalTxIds: [],
    swapAndTransferTxId: null,
    signatureSetAddress: null,
    postVaaOnSolanaTxIds: [],
    claimTokenOnSolanaTxId: null,
    swapFromSwimUsdTxId: null,
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
      Amount.fromHumanString(SOLANA_USDC_TESTNET, "5"),
      Amount.fromHumanString(SOLANA_USDT_TESTNET, "5"),
    ],
    minimumMintAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-solana-usdc-usdt"], // TODO remove from type?
  poolId: "testnet-solana-usdc-usdt",
  lpTokenTargetEcosystem: SOLANA_ECOSYSTEM_ID,
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: null,
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const ADD_INTERACTION_STATE_SOLANA_INIT: AddInteractionState = {
  version: 2,
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
      Amount.fromHumanString(ETHEREUM_USDC_TESTNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_TESTNET, "5"),
    ],
    minimumMintAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-ethereum-usdc-usdt"], // TODO remove from type?
  poolId: "testnet-ethereum-usdc-usdt",
  lpTokenTargetEcosystem: EvmEcosystemId.Ethereum,
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: null,
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const ADD_INTERACTION_STATE_ETHEREUM_INIT: AddInteractionState = {
  version: 2,
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
      Amount.fromHumanString(SOLANA_USDC_TESTNET, "5"),
      Amount.fromHumanString(SOLANA_USDT_TESTNET, "5"),
    ],
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-solana-usdc-usdt"], // TODO remove from type?
  poolId: "testnet-solana-usdc-usdt",
  lpTokenSourceEcosystem: SOLANA_ECOSYSTEM_ID,
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: null,
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const REMOVE_UNIFORM_INTERACTION_STATE_SOLANA_INIT: RemoveInteractionState =
  {
    version: 2,
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
      Amount.fromHumanString(ETHEREUM_USDC_TESTNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_TESTNET, "5"),
    ],
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
  },
  id: "2eed9eef597a2aa14314845afe87079f",
  poolIds: ["testnet-ethereum-usdc-usdt"], // TODO remove from type?
  poolId: "testnet-ethereum-usdc-usdt",
  lpTokenSourceEcosystem: SOLANA_ECOSYSTEM_ID,
  env: Env.Testnet,
  submittedAt: 1653624596234,
  connectedWallets: {
    [APTOS_ECOSYSTEM_ID]: null,
    [SOLANA_ECOSYSTEM_ID]: null,
    [EvmEcosystemId.Bnb]: null,
    [EvmEcosystemId.Ethereum]: "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
    [EvmEcosystemId.Acala]: null,
    [EvmEcosystemId.Aurora]: null,
    [EvmEcosystemId.Avalanche]: null,
    [EvmEcosystemId.Fantom]: null,
    [EvmEcosystemId.Karura]: null,
    [EvmEcosystemId.Polygon]: null,
  },
};

export const REMOVE_UNIFORM_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    version: 2,
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
    exactBurnAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
    minimumOutputAmount: Amount.fromHumanString(ETHEREUM_USDC_TESTNET, "10"),
  },
};

export const REMOVE_EXACT_BURN_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    version: 2,
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
    maximumBurnAmount: Amount.fromHumanString(SWIMUSD_TESTNET, "10"),
    exactOutputAmounts: [
      Amount.fromHumanString(ETHEREUM_USDC_TESTNET, "5"),
      Amount.fromHumanString(ETHEREUM_USDT_TESTNET, "5"),
    ],
  },
};

export const REMOVE_EXACT_OUTPUT_INTERACTION_STATE_ETHEREUM_INIT: RemoveInteractionState =
  {
    version: 2,
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

export const MOCK_SERIALIZED_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_INIT = {
  version: 2,
  interaction: {
    connectedWallets: {
      [APTOS_ECOSYSTEM_ID]: null,
      acala: null,
      aurora: null,
      avalanche: null,
      bnb: null,
      ethereum: null,
      fantom: null,
      karura: null,
      polygon: null,
      solana: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
    },
    env: Env.Testnet,
    id: "2eed9eef597a2aa14314845afe87079f",
    params: {
      fromTokenData: {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        tokenId: "testnet-solana-usdc",
        value: "100",
      },
      toTokenData: {
        ecosystemId: SOLANA_ECOSYSTEM_ID,
        tokenId: "testnet-solana-usdt",
        value: "101",
      },
    },
    poolIds: ["testnet-solana-usdc-usdt"],
    submittedAt: 1653624596234,
    type: 5,
  },
  interactionType: InteractionType.SwapV2,
  swapType: SwapType.SingleChainSolana,
  onChainSwapTxId: null,
  requiredSplTokenAccounts: {
    "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
      isExistingAccount: false,
      txId: null,
    },
    Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
      isExistingAccount: false,
      txId: null,
    },
  },
} as PersistedInteractionStateV2;
