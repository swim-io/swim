import type { EcosystemId } from "../../config";
import { useConfig } from "../../contexts";
import { getRequiredEcosystems } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredEcosystemsForInteraction = (
  interactionId: string,
): ReadonlySet<EcosystemId> => {
  const { tokens } = useConfig();
  const interaction = useInteraction(interactionId);
  return getRequiredEcosystems(tokens, interaction);
};
