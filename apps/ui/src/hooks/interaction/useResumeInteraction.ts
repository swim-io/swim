import { useInteractionMutation } from "./useInteractionMutation";

export const useResumeInteraction = (): ((interactionId: string) => void) => {
  const { mutate } = useInteractionMutation();
  return mutate;
};
