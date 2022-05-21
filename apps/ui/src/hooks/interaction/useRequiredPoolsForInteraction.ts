import type { PoolSpec } from "../../config";
import { useConfig } from "../../contexts";
import { getRequiredPools } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredPoolsForInteraction = (
  interactionId: string,
): readonly PoolSpec[] => {
  const { pools } = useConfig();
  const interaction = useInteraction(interactionId);
  return getRequiredPools(pools, interaction);
};
