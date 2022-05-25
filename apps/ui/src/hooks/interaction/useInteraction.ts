import { useConfig, useEnvironment } from "../../contexts";
import { loadInteractions } from "../../models";

export const useInteraction = (interactionId: string) => {
  const { env } = useEnvironment();
  const config = useConfig();
  const interactions = loadInteractions(env, config);
  const interaction = interactions.find(({ id }) => id === interactionId);

  if (!interaction) {
    throw new Error("Interaction not found");
  }
  return interaction;
};
