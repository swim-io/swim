import { useIsMutating } from "react-query";

import { selectInteractionError } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import type { InteractionState } from "../../models";
import { InteractionStatus, isInteractionCompleted } from "../../models";

import { INTERACTION_MUTATION_KEY } from "./useInteractionMutation";

export const useInteractionStatus = (interactionState: InteractionState) => {
  const { interaction } = interactionState;
  const isCompleted = isInteractionCompleted(interactionState);
  const hasError =
    useInteractionState((state) =>
      selectInteractionError(state, interaction.id),
    ) !== undefined;

  const isActive =
    useIsMutating({
      predicate: (mutation) =>
        mutation.options.mutationKey === INTERACTION_MUTATION_KEY &&
        mutation.options.variables === interaction.id,
    }) === 1;

  if (isCompleted) {
    return InteractionStatus.Completed;
  } else if (isActive) {
    return InteractionStatus.Active;
  } else if (hasError) {
    return InteractionStatus.Error;
  }
  return InteractionStatus.Incomplete;
};
