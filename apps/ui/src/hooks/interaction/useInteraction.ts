import { useEnvironment } from "../../core/store";
import { loadInteractions } from "../../models";

export const useInteraction = (interactionId: string) => {
  const { env, config } = useEnvironment();
  const interactions = loadInteractions(env, config);
  const interaction = interactions.find(({ id }) => id === interactionId);

  if (!interaction) {
    throw new Error("Interaction not found");
  }
  return interaction;
};
