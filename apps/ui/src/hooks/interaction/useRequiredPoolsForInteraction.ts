import type { PoolSpec } from "../../config";
import { useConfig } from "../../contexts";
import type { Interaction } from "../../models";
import { getRequiredPools } from "../../models";

export const useRequiredPoolsForInteraction = (
  interaction: Interaction,
): readonly PoolSpec[] => {
  const { pools } = useConfig();
  return getRequiredPools(pools, interaction);
};
