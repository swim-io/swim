import { useMutation, useQueryClient } from "react-query";

import { useInteractionState } from "../../core/store";

import { useFromSolanaTransferMutation } from "./useFromSolanaTransferMutation";
import { useSolanaPoolOperationsMutation } from "./usePoolOperationsMutation";
import { usePrepareSplTokenAccountMutation } from "./usePrepareSplTokenAccountMutation";
import { useToSolanaTransferMutation } from "./useToSolanaTransferMutation";

export const INTERACTION_MUTATION_KEY = ["interactionMutation"];

export const useInteractionMutation = () => {
  const { setInteractionError } = useInteractionState();

  const { mutateAsync: prepareSplTokenAccountMutateAsync } =
    usePrepareSplTokenAccountMutation();
  const { mutateAsync: toSolanaTransferMutateAsync } =
    useToSolanaTransferMutation();
  const { mutateAsync: solanaPoolOperationsMutateAsync } =
    useSolanaPoolOperationsMutation();
  const { mutateAsync: fromSolanaTransferMutateAsync } =
    useFromSolanaTransferMutation();

  const queryClient = useQueryClient();

  return useMutation(
    async (interactionId: string) => {
      await prepareSplTokenAccountMutateAsync(interactionId);
      await toSolanaTransferMutateAsync(interactionId);
      await solanaPoolOperationsMutateAsync(interactionId);
      await fromSolanaTransferMutateAsync(interactionId);
    },
    {
      mutationKey: INTERACTION_MUTATION_KEY,
      onSuccess: (_, interactionId) => {
        setInteractionError(interactionId, undefined);
      },
      onError: (error: Error, interactionId) => {
        setInteractionError(interactionId, error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(["erc20Balance"]);
        await queryClient.invalidateQueries(["tokenAccounts"]);
      },
    },
  );
};
