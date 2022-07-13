import type { InteractionStateV2 } from "../../models";
import type { InteractionStoreV2 } from "../store";

export const selectInteractionErrorV2 = (
  state: InteractionStoreV2,
  id: string,
): Error | undefined => state.errorMap[id];

export const selectInteractionStateByIdV2 = (
  state: InteractionStoreV2,
  id: string,
): InteractionStateV2 => selectGetInteractionStateV2(state)(id);

export const selectGetInteractionStateV2 =
  (state: InteractionStoreV2) =>
  (id: string): InteractionStateV2 => {
    const interactionState = state.interactionStates.find(
      ({ interaction }) => interaction.id === id,
    );
    if (!interactionState) {
      throw new Error(`Interaction ${id} not exist`);
    }
    return interactionState;
  };
