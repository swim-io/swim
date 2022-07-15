import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { SingleChainSolanaSwapInteractionState } from "../../models";
import {
  InteractionType,
  SwapType,
  doSingleSolanaPoolOperation,
  getTokensByPool,
} from "../../models";
import { findOrThrow } from "../../utils";
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
      const { interaction, solanaPoolOperations } = interactionState;
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
      if (solanaPoolOperations.length !== 1) {
        throw new Error("Invalid number of operation");
      }
      const txId = await doSingleSolanaPoolOperation(
        env,
        solanaConnection,
        solanaWallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpec,
        solanaPoolOperations[0].operation,
      );
      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.SingleChainSolana) {
          throw new Error("Swap type mismatch");
        }
        draft.solanaPoolOperations[0].txId = txId;
      });
    },
  );
};
