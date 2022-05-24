import type { EcosystemId } from "../../config";
import { useConfig } from "../../contexts";
import type { Interaction } from "../../models";
import { getRequiredEcosystems } from "../../models";

export const useRequiredEcosystemsForInteraction = (
  interaction: Interaction,
): ReadonlySet<EcosystemId> => {
  const { tokens } = useConfig();
  return getRequiredEcosystems(tokens, interaction);
};
