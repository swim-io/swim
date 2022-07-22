import { useInteractionStateV2 } from "../../core/store";
import type { InteractionSpecV2 } from "../../models";

import { useCreateInteractionStateV2 } from "./useCreateInteractionStateV2";
import { useInteractionMutationV2 } from "./useInteractionMutationV2";

export const useStartNewInteractionV2 = (onMutateSuccess?: VoidFunction) => {
  const createInteractionState = useCreateInteractionStateV2();
  const { addInteractionState } = useInteractionStateV2();
  const { mutate } = useInteractionMutationV2();
  return (interactionSpec: InteractionSpecV2) => {
    const interactionState = createInteractionState(interactionSpec);
    addInteractionState(interactionState);
    mutate(interactionState.interaction.id, {
      onSuccess: onMutateSuccess,
    });
  };
};
