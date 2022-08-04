import { useInteractionState } from "../../core/store";

import { useCreateInteractionState } from "./useCreateInteractionState";
import { useInteractionMutation } from "./useInteractionMutation";

export const useStartNewInteraction = (onMutateSuccess?: VoidFunction) => {
  const { addInteractionState } = useInteractionState();
  const { mutate } = useInteractionMutation();
  const createInteractionState = useCreateInteractionState({
    onCreate: (interactionState): void => {
      addInteractionState(interactionState);
      mutate(interactionState.interaction.id, {
        onSuccess: onMutateSuccess,
      });
    },
  });
  return createInteractionState;
};
