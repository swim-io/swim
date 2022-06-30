import Decimal from "decimal.js";

import { EcosystemId, Env } from "../../config";
import type { PersistedInteractionState } from "../../core/store/idb/helpers";
import type { InteractionState } from "../../models";
import { Amount } from "../../models";

import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "./tokens";

export const MOCK_INTERACTION_STATE: InteractionState = {
  interaction: {
    type: 0,
    params: {
      exactInputAmount: Amount.fromHumanString(BNB_USDT, "1001"),
      minimumOutputAmount: Amount.fromHumanString(ETHEREUM_USDC, "995.624615"),
    },
    id: "5eed9eef597a2aa14314845afe87079f",
    poolIds: ["hexapool"],
    env: Env.CustomLocalnet,
    submittedAt: 1653624596234,
    signatureSetKeypairs: {},
    previousSignatureSetAddresses: {},
    connectedWallets: {
      [EcosystemId.Solana]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
      [EcosystemId.Bnb]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EcosystemId.Ethereum]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EcosystemId.Acala]: null,
      [EcosystemId.Aurora]: null,
      [EcosystemId.Avalanche]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Karura]: null,
      [EcosystemId.Polygon]: null,
    },
  },
  requiredSplTokenAccounts: {
    "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
      isExistingAccount: false,
      account: null,
      txId: null,
    },
    Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
      isExistingAccount: false,
      account: null,
      txId: null,
    },
  },
  toSolanaTransfers: [
    {
      token: BNB_USDT,
      value: new Decimal(1001),
      txIds: {
        approveAndTransferEvmToken: [],
        postVaaOnSolana: [],
        claimTokenOnSolana: null,
      },
    },
  ],
  solanaPoolOperations: [
    {
      operation: {
        interactionId: "5eed9eef597a2aa14314845afe87079f",
        poolId: "hexapool",
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
  ],
  fromSolanaTransfers: [
    {
      token: ETHEREUM_USDC,
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ],
};

export const MOCK_PREPARED_INTERACTION_STATE: PersistedInteractionState = {
  interaction: {
    type: 0,
    params: {
      exactInputAmount: {
        tokenId: "localnet-bnb-usdt",
        value: "1001",
      },
      minimumOutputAmount: {
        tokenId: "localnet-ethereum-usdc",
        value: "995.624615",
      },
    },
    id: "5eed9eef597a2aa14314845afe87079f",
    poolIds: ["hexapool"],
    env: Env.CustomLocalnet,
    submittedAt: 1653624596234,
    signatureSetKeypairs: {},
    previousSignatureSetAddresses: {},
    connectedWallets: {
      [EcosystemId.Solana]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
      [EcosystemId.Bnb]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EcosystemId.Ethereum]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EcosystemId.Acala]: null,
      [EcosystemId.Aurora]: null,
      [EcosystemId.Avalanche]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Karura]: null,
      [EcosystemId.Polygon]: null,
    },
  },
  requiredSplTokenAccounts: {
    "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
      isExistingAccount: false,
      account: null,
      txId: null,
    },
    Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
      isExistingAccount: false,
      account: null,
      txId: null,
    },
  },
  toSolanaTransfers: [
    {
      token: {
        id: "localnet-bnb-usdt",
      },
      value: "1001",
      txIds: {
        approveAndTransferEvmToken: [],
        postVaaOnSolana: [],
        claimTokenOnSolana: null,
      },
    },
  ],
  solanaPoolOperations: [
    {
      operation: {
        interactionId: "5eed9eef597a2aa14314845afe87079f",
        poolId: "hexapool",
        instruction: 1,
        params: {
          exactInputAmounts: [
            { tokenId: "localnet-solana-usdc", value: "0" },
            { tokenId: "localnet-solana-usdt", value: "0" },
            { tokenId: "localnet-ethereum-usdc", value: "0" },
            { tokenId: "localnet-ethereum-usdt", value: "0" },
            { tokenId: "localnet-bnb-busd", value: "0" },
            { tokenId: "localnet-bnb-usdt", value: "1001" },
          ],
          outputTokenIndex: 2,
          minimumOutputAmount: {
            tokenId: "localnet-ethereum-usdc",
            value: "995.624615",
          },
        },
      },
      txId: null,
    },
  ],
  fromSolanaTransfers: [
    {
      token: {
        id: "localnet-ethereum-usdc",
      },
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ],
};
