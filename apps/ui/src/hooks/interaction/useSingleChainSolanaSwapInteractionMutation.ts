import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type { TokenConfig } from "config";
import Decimal from "decimal.js";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  OperationSpec,
  SingleChainSolanaSwapInteractionState,
  SwapInteractionV2,
  TokensByPoolId,
} from "../../models";
import {
  Amount,
  InteractionType,
  SwapType,
  SwimDefiInstruction,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";
import { useSwimUsd } from "../swim";

const createOperationSpec = (
  interaction: SwapInteractionV2,
  tokensByPoolId: TokensByPoolId,
  swimUsd: TokenConfig,
): OperationSpec => {
  const {
    params: { fromTokenData, toTokenData },
    poolIds,
  } = interaction;
  const poolId = poolIds[0];
  if (fromTokenData.tokenConfig === swimUsd) {
    return {
      interactionId: interaction.id,
      poolId,
      instruction: SwimDefiInstruction.RemoveExactBurn,
      params: {
        exactBurnAmount: Amount.fromHuman(swimUsd, fromTokenData.value),
        outputTokenIndex: tokensByPoolId[poolId].tokens.findIndex(
          (token) => token === toTokenData.tokenConfig,
        ),
        minimumOutputAmount: Amount.fromHuman(
          toTokenData.tokenConfig,
          toTokenData.value,
        ),
      },
    };
  }
  if (toTokenData.tokenConfig === swimUsd) {
    return {
      interactionId: interaction.id,
      poolId,
      instruction: SwimDefiInstruction.Add,
      params: {
        inputAmounts: tokensByPoolId[poolId].tokens.map((token) =>
          Amount.fromHuman(
            token,
            token.id === fromTokenData.tokenConfig.id
              ? fromTokenData.value
              : new Decimal(0),
          ),
        ),
        minimumMintAmount: Amount.fromHuman(swimUsd, toTokenData.value),
      },
    };
  }
  return {
    interactionId: interaction.id,
    poolId,
    instruction: SwimDefiInstruction.Swap,
    params: {
      exactInputAmounts: tokensByPoolId[poolId].tokens.map((token) =>
        Amount.fromHuman(
          token,
          token.id === fromTokenData.tokenConfig.id
            ? fromTokenData.value
            : new Decimal(0),
        ),
      ),
      outputTokenIndex: tokensByPoolId[poolId].tokens.findIndex(
        (token) => token === toTokenData.tokenConfig,
      ),
      minimumOutputAmount: Amount.fromHuman(
        toTokenData.tokenConfig,
        toTokenData.value,
      ),
    },
  };
};

export const useSingleChainSolanaSwapInteractionMutation = () => {
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const { data: existingSplTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();
  const swimUsd = useSwimUsd();
  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async (interactionState: SingleChainSolanaSwapInteractionState) => {
      const { interaction, requiredSplTokenAccounts } = interactionState;
      const { address, wallet } = wallets[SOLANA_ECOSYSTEM_ID];
      if (swimUsd === null) {
        throw new Error("SwimUsd not found");
      }
      if (wallet === null || address === null) {
        throw new Error("Solana wallet not connected");
      }
      const splTokenAccounts = await Promise.all(
        Object.keys(requiredSplTokenAccounts).map(async (mint) => {
          const { tokenAccount, creationTxId } =
            await findOrCreateSplTokenAccount(
              env,
              solanaClient,
              wallet,
              queryClient,
              mint,
              existingSplTokenAccounts,
            );
          // Update interactionState
          if (creationTxId !== null) {
            updateInteractionState(interaction.id, (draft) => {
              if (
                draft.interactionType !== InteractionType.SwapV2 ||
                draft.swapType !== SwapType.SingleChainSolana
              ) {
                throw new Error("Interaction type mismatch");
              }
              draft.requiredSplTokenAccounts[mint].txId = creationTxId;
            });
          }
          return tokenAccount;
        }),
      );
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
      const operation = createOperationSpec(
        interaction,
        tokensByPoolId,
        swimUsd,
      );
      const txId = await doSingleSolanaPoolOperationV2(
        solanaClient,
        solanaWallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpec,
        operation,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (
          draft.interactionType !== InteractionType.SwapV2 ||
          draft.swapType !== SwapType.SingleChainSolana
        ) {
          throw new Error("Interaction type mismatch");
        }
        draft.onChainSwapTxId = txId;
      });
    },
  );
};
