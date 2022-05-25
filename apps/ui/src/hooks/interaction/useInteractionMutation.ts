import { useMutation } from "react-query";

import type { InteractionState } from "../../models";

import { useFromSolanaTransferMutation } from "./useFromSolanaTransferMutation";
import { usePrepareSplTokenAccountMutation } from "./usePrepareSplTokenAccountMutation";
import { useSolanaPoolOperationsMutation } from "./useSolanaPoolOperationsMutation";
import { useToSolanaTransferMutation } from "./useToSolanaTransferMutation";

export const useInteractionMutation = () => {
  const { mutateAsync: prepareSplTokenAccountMutateAsync } =
    usePrepareSplTokenAccountMutation();
  const { mutateAsync: toSolanaTransferMutateAsync } =
    useToSolanaTransferMutation();
  const { mutateAsync: solanaPoolOperationsMutateAsync } =
    useSolanaPoolOperationsMutation();
  const { mutateAsync: fromSolanaTransferMutateAsync } =
    useFromSolanaTransferMutation();

  return useMutation(async (interactionState: InteractionState) => {
    const { toSolanaTransfers, fromSolanaTransfers } = interactionState;

    // Prepare spl token accounts
    await prepareSplTokenAccountMutateAsync(interactionState);

    // Process to solana transfer
    for (const transfer of toSolanaTransfers) {
      await toSolanaTransferMutateAsync({ interactionState, transfer });
    }

    // Process solana pool operation
    await solanaPoolOperationsMutateAsync(interactionState);

    // Process from solana transfer
    for (const transfer of fromSolanaTransfers) {
      await fromSolanaTransferMutateAsync({ interactionState, transfer });
    }
  });
};
