import shallow from "zustand/shallow";

import type { EcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { getRequiredEcosystems } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredEcosystemsForInteraction = (
  interactionId: string,
): ReadonlySet<EcosystemId> => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const interaction = useInteraction(interactionId);
  return getRequiredEcosystems(tokens, interaction);
};
