import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";

export const useInteraction = (interactionId: string) => {
  const getInteractionState = useInteractionState(selectGetInteractionState);
  const { interaction } = getInteractionState(interactionId);
  return interaction;
};
