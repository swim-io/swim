import { useIsMutating } from "react-query";

import { selectInteractionErrorV2 } from "../../core/selectors";
import { useInteractionStateV2 } from "../../core/store";
import { isInteractionCompletedV2 } from "../../models";
import type { InteractionStateV2 } from "../../models";

import { INTERACTION_MUTATION_KEY_V2 } from "./useInteractionMutationV2";

export const enum InteractionStatusV2 {
  Incomplete,
  Active,
  Completed,
  Error,
}

export const useInteractionStatusV2 = (
  interactionState: InteractionStateV2,
) => {
  const { interaction } = interactionState;
  const isCompleted = isInteractionCompletedV2(interactionState);
  const hasError =
    useInteractionStateV2((state) =>
      selectInteractionErrorV2(state, interaction.id),
    ) !== undefined;

  const isActive =
    useIsMutating({
      predicate: (mutation) =>
        mutation.options.mutationKey === INTERACTION_MUTATION_KEY_V2 &&
        mutation.options.variables === interaction.id,
    }) === 1;

  if (isCompleted) {
    return InteractionStatusV2.Completed;
  } else if (isActive) {
    return InteractionStatusV2.Active;
  } else if (hasError) {
    return InteractionStatusV2.Error;
  }
  return InteractionStatusV2.Incomplete;
};
