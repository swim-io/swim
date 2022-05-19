import { useInteraction } from "../../hooks/interaction";
import { useInteractionState } from "../../hooks/interaction/useInteractionState";

const InteractionStateComponent = (interactionId: string) => {
  const interaction = useInteraction(interactionId);
  const interactionState = useInteractionState(interactionId);

  return null;
};
