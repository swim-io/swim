import type { PoolSpec } from "../../config";
import { useEnvironment } from "../../core/store";
import { getRequiredPools } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredPoolsForInteraction = (
  interactionId: string,
): readonly PoolSpec[] => {
  const {
    config: { pools },
  } = useEnvironment();
  const interaction = useInteraction(interactionId);
  return getRequiredPools(pools, interaction);
};
