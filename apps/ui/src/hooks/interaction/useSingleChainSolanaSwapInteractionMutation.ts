import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import Decimal from "decimal.js";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  OperationSpec,
  SingleChainSolanaSwapInteractionState,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  doSingleSolanaPoolOperation,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSolanaConnection, useSplTokenAccountsQuery } from "../solana";

export const useSingleChainSolanaSwapInteractionMutation = () => {
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const solanaConnection = useSolanaConnection();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();

  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async (interactionState: SingleChainSolanaSwapInteractionState) => {
      const { interaction } = interactionState;
      const {
        params: { fromTokenDetail, toTokenDetail },
      } = interaction;
      if (interaction.poolIds.length !== 1) {
        throw new Error("Single chain solana swap should only have 1 pool ID");
      }
      const poolSpec = findOrThrow(
        config.pools,
        (pool) => pool.id === interaction.poolIds[0],
      );
      if (poolSpec.ecosystem !== SOLANA_ECOSYSTEM_ID) {
        throw new Error("Expected Solana pool");
      }
      const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
      if (solanaWallet === null) {
        throw new Error("Missing Solana wallet");
      }
      const toToken = findOrThrow(
        config.tokens,
        (token) => token.id === toTokenDetail.tokenId,
      );
      const operation: OperationSpec = {
        interactionId: interaction.id,
        poolId: poolSpec.id,
        instruction: SwimDefiInstruction.Swap,
        params: {
          exactInputAmounts: tokensByPoolId[poolSpec.id].tokens.map((token) =>
            Amount.fromHuman(
              token,
              token.id === fromTokenDetail.tokenId
                ? fromTokenDetail.value
                : new Decimal(0),
            ),
          ),
          outputTokenIndex: poolSpec.tokens.findIndex(
            (tokenId) => tokenId === toTokenDetail.tokenId,
          ),
          minimumOutputAmount: Amount.fromHuman(toToken, toTokenDetail.value),
        },
      };
      const txId = await doSingleSolanaPoolOperation(
        env,
        solanaConnection,
        solanaWallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpec,
        operation,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.SingleChainSolana) {
          throw new Error("Swap type mismatch");
        }
        draft.onChainSwapTxId = txId;
      });
    },
  );
};
