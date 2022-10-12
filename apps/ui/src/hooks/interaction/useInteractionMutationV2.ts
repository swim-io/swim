import { useMutation, useQueryClient } from "react-query";

import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import { InteractionType, SwapType } from "../../models";

import { useAddInteractionMutation } from "./useAddInteractionMutation";
import { useCrossChainEvmToEvmSwapInteractionMutation } from "./useCrossChainEvmToEvmSwapInteractionMutation";
import { useCrossChainEvmToSolanaSwapInteractionMutation } from "./useCrossChainEvmToSolanaSwapInteractionMutation";
import { useCrossChainSolanaToEvmSwapInteractionMutation } from "./useCrossChainSolanaToEvmSwapInteractionMutation";
import { useRemoveInteractionMutation } from "./useRemoveInteractionMutation";
import { useSingleChainEvmSwapInteractionMutation } from "./useSingleChainEvmSwapInteractionMutation";
import { useSingleChainSolanaSwapInteractionMutation } from "./useSingleChainSolanaSwapInteractionMutation";

export const INTERACTION_MUTATION_KEY_V2 = ["interactionMutationV2"];

export const useInteractionMutationV2 = () => {
  const { env } = useEnvironment();
  const { getInteractionState, setInteractionError } = useInteractionStateV2();
  const queryClient = useQueryClient();

  const { mutateAsync: addInteractionMutation } = useAddInteractionMutation();
  const { mutateAsync: removeInteractionMutation } =
    useRemoveInteractionMutation();
  const { mutateAsync: singleChainEvmSwapInteractionMutation } =
    useSingleChainEvmSwapInteractionMutation();
  const { mutateAsync: singleChainSolanaSwapInteractionMutation } =
    useSingleChainSolanaSwapInteractionMutation();
  const { mutateAsync: crossChainEvmToEvmSwapInteractionMutation } =
    useCrossChainEvmToEvmSwapInteractionMutation();
  const { mutateAsync: crossChainSolanaToEvmSwapInteractionMutation } =
    useCrossChainSolanaToEvmSwapInteractionMutation();
  const { mutateAsync: crossChainEvmToSolanaSwapInteractionMutation } =
    useCrossChainEvmToSolanaSwapInteractionMutation();

  return useMutation(
    async (interactionId: string) => {
      const interactionState = getInteractionState(interactionId);
      switch (interactionState.interactionType) {
        case InteractionType.Add:
          await addInteractionMutation(interactionState);
          break;
        case InteractionType.RemoveExactBurn:
        case InteractionType.RemoveExactOutput:
        case InteractionType.RemoveUniform:
          await removeInteractionMutation(interactionState);
          break;
        case InteractionType.SwapV2:
          switch (interactionState.swapType) {
            case SwapType.SingleChainSolana:
              await singleChainSolanaSwapInteractionMutation(interactionState);
              break;
            case SwapType.SingleChainEvm:
              await singleChainEvmSwapInteractionMutation(interactionState);
              break;
            case SwapType.CrossChainEvmToEvm:
              await crossChainEvmToEvmSwapInteractionMutation(interactionState);
              break;
            case SwapType.CrossChainSolanaToEvm:
              await crossChainSolanaToEvmSwapInteractionMutation(
                interactionState,
              );
              break;
            case SwapType.CrossChainEvmToSolana:
              await crossChainEvmToSolanaSwapInteractionMutation(
                interactionState,
              );
              break;
            default:
              throw new Error("Unsupported swap type");
          }
          break;
        default:
          throw new Error("Unsupported interaction type");
      }
    },
    {
      mutationKey: INTERACTION_MUTATION_KEY_V2,
      onSuccess: (_, interactionId) => {
        setInteractionError(interactionId, undefined);
      },
      onError: (error: Error, interactionId) => {
        setInteractionError(interactionId, error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries([env, "erc20Balance"]);
      },
    },
  );
};
