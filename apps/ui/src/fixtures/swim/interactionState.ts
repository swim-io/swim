import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import Decimal from "decimal.js";

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
  version: undefined,
  interaction: {
    type: 0,
    params: {
      exactInputAmount: Amount.fromHumanString(BNB_USDT, "1001"),
      minimumOutputAmount: Amount.fromHumanString(ETHEREUM_USDC, "995.624615"),
    },
    id: "5eed9eef597a2aa14314845afe87079f",
    poolIds: ["hexapool"],
    env: Env.Custom,
    submittedAt: 1653624596234,
    connectedWallets: {
      [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
      [EvmEcosystemId.Bnb]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EvmEcosystemId.Ethereum]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EvmEcosystemId.Acala]: null,
      [EvmEcosystemId.Aurora]: null,
      [EvmEcosystemId.Avalanche]: null,
      [EvmEcosystemId.Fantom]: null,
      [EvmEcosystemId.Karura]: null,
      [EvmEcosystemId.Polygon]: null,
    },
  },
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
  toSolanaTransfers: [
    {
      token: BNB_USDT,
      value: new Decimal(1001),
      signatureSetAddress: null,
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
  version: undefined,
  interaction: {
    type: 0,
    params: {
      exactInputAmount: {
        tokenId: "local-bnb-usdt",
        value: "1001",
      },
      minimumOutputAmount: {
        tokenId: "local-ethereum-usdc",
        value: "995.624615",
      },
    },
    id: "5eed9eef597a2aa14314845afe87079f",
    poolIds: ["hexapool"],
    env: Env.Custom,
    submittedAt: 1653624596234,
    connectedWallets: {
      [SOLANA_ECOSYSTEM_ID]: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
      [EvmEcosystemId.Bnb]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EvmEcosystemId.Ethereum]: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
      [EvmEcosystemId.Acala]: null,
      [EvmEcosystemId.Aurora]: null,
      [EvmEcosystemId.Avalanche]: null,
      [EvmEcosystemId.Fantom]: null,
      [EvmEcosystemId.Karura]: null,
      [EvmEcosystemId.Polygon]: null,
    },
  },
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
  toSolanaTransfers: [
    {
      token: {
        id: "local-bnb-usdt",
      },
      value: "1001",
      signatureSetAddress: null,
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
            { tokenId: "local-solana-usdc", value: "0" },
            { tokenId: "local-solana-usdt", value: "0" },
            { tokenId: "local-ethereum-usdc", value: "0" },
            { tokenId: "local-ethereum-usdt", value: "0" },
            { tokenId: "local-bnb-busd", value: "0" },
            { tokenId: "local-bnb-usdt", value: "1001" },
          ],
          outputTokenIndex: 2,
          minimumOutputAmount: {
            tokenId: "local-ethereum-usdc",
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
        id: "local-ethereum-usdc",
      },
      value: null,
      txIds: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ],
};
