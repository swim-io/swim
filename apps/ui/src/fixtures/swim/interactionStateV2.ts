import Decimal from "decimal.js";

import { EcosystemId, Env } from "../../config";
import { Amount, InteractionType } from "../../models";
import type { InteractionStateV2 } from "../../models/swim/interactionStateV2";
import { SwapType } from "../../models/swim/interactionStateV2";

import {
  BNB_BUSD,
  BNB_USDT,
  ETHEREUM_USDC,
  ETHEREUM_USDT,
  SOLANA_USDC,
  SOLANA_USDT,
} from "./tokens";

export const MOCK_SINGLE_CHAIN_SOLANA_SWAP_INTERACTION_STATE_COMPLETED: InteractionStateV2 =
  {
    interaction: {
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
    },
    interactionType: InteractionType.SwapV2,
    swapType: SwapType.SingleChainSolana,
    requiredSplTokenAccounts: {
      "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr": {
        isExistingAccount: false,
        txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
      },
      Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb: {
        isExistingAccount: false,
        txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
      },
    },
    solanaPoolOperations: [
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
        txId: "53r98E5EiffkmJ6WVA2VKmq78LVCT4zcRVxo76EWoUFiNpdxbno7UVeUT6oQgsVM3xeU99mQmnUjFVscz7PC1gK8",
      },
    ],
  };
