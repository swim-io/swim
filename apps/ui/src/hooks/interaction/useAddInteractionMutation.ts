import { findOrThrow } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { EcosystemId, isEvmEcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type { AddInteractionState } from "../../models";
import {
  InteractionType,
  createOperationSpecs,
  doSingleSolanaPoolOperation,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSolanaConnection, useSplTokenAccountsQuery } from "../solana";

export const useAddInteractionMutation = () => {
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const solanaConnection = useSolanaConnection();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();

  const tokensByPoolId = getTokensByPool(config);

  return useMutation(async (interactionState: AddInteractionState) => {
    const { interaction } = interactionState;
    const poolSpec = findOrThrow(
      config.pools,
      (pool) => pool.id === interaction.poolId,
    );

    if (poolSpec.ecosystem === EcosystemId.Solana) {
      const solanaWallet = wallets[EcosystemId.Solana].wallet;
      if (solanaWallet === null) {
        throw new Error("Missing Solana wallet");
      }
      const solanaPoolOperations = createOperationSpecs(
        tokensByPoolId,
        [poolSpec],
        [],
        interaction,
      );
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
        solanaPoolOperations[0],
      );
      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.Add) {
          throw new Error("Interaction type mismatch");
        }
        draft.addTxId = txId;
      });
    } else if (isEvmEcosystemId(poolSpec.ecosystem)) {
      // TODO: handle add to EVM pool
    } else {
      throw new Error("Unexpected ecosystem for add interaction");
    }
  });
};
