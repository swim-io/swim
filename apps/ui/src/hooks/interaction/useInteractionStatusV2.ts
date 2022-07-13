import { isInteractionCompletedV2 } from "../../models";
import type { InteractionStateV2 } from "../../models";

export const enum InteractionStatusV2 {
  Incomplete,
  Active,
  Completed,
  Error,
}

export const useInteractionStatusV2 = (
  interactionState: InteractionStateV2,
) => {
  // const { interaction } = interactionState;
  const isCompleted = isInteractionCompletedV2(interactionState);
  // const hasError = false; // TODO - create new store
  // useInteractionState((state) =>
  //   selectInteractionError(state, interaction.id),
  // ) !== undefined;

  // const isActive = false; // TODO - create new INTERACTION_MUTATION_KEY
  // useIsMutating({
  //   predicate: (mutation) =>
  //     mutation.options.mutationKey === INTERACTION_MUTATION_KEY &&
  //     mutation.options.variables === interaction.id,
  // }) === 1;

  if (isCompleted) {
    return InteractionStatusV2.Completed;
  }
  // else if (isActive) {
  //   return InteractionStatusV2.Active;
  // } else if (hasError) {
  //   return InteractionStatusV2.Error;
  // }
  return InteractionStatusV2.Incomplete;
};
