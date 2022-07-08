import { useInteractionState } from "../../core/store";
import type { InteractionSpec } from "../../models";

import { useCreateInteractionState } from "./useCreateInteractionState";
import { useInteractionMutation } from "./useInteractionMutation";

export const useStartNewInteraction = (onMutateSuccess?: VoidFunction) => {
  const createInteractionState = useCreateInteractionState();
  const { addInteractionState } = useInteractionState();
  const { mutate } = useInteractionMutation();
  return (interactionSpec: InteractionSpec) => {
    const interactionState = createInteractionState(interactionSpec);
    addInteractionState(interactionState);
    mutate(interactionState.interaction.id, {
      onSuccess: mutateSuccessCb,
    });
  };
};
