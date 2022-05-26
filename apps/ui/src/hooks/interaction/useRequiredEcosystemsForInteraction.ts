import type { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import { getRequiredEcosystems } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredEcosystemsForInteraction = (
  interactionId: string,
): ReadonlySet<EcosystemId> => {
  const {
    config: { tokens },
  } = useEnvironment();
  const interaction = useInteraction(interactionId);
  return getRequiredEcosystems(tokens, interaction);
};
