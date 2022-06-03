import type { InteractionState } from "../../models";
import type { InteractionStore } from "../store";

export const selectInteractionError = (
  state: InteractionStore,
  id: string,
): Error | undefined => state.errorMap[id];

export const selectInteractionStateById = (
  state: InteractionStore,
  id: string,
): InteractionState | Error => {
  const interactionState = state.interactionStates.find(
    ({ interaction }) => interaction.id === id,
  );
  if (!interactionState) {
    throw new Error(`Interaction ${id} not exist`);
  }
  return interactionState;
};
