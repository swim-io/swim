import shallow from "zustand/shallow";

import type { PoolSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { getRequiredPools } from "../../models";

import { useInteraction } from "./useInteraction";

export const useRequiredPoolsForInteraction = (
  interactionId: string,
): readonly PoolSpec[] => {
  const { pools } = useEnvironment(selectConfig, shallow);
  const interaction = useInteraction(interactionId);
  return getRequiredPools(pools, interaction);
};
