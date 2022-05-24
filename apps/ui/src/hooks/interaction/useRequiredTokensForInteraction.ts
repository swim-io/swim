import type { TokenSpec } from "../../config";
import { useConfig } from "../../contexts";
import type { Interaction } from "../../models";
import { getRequiredTokens, getTokensByPool } from "../../models";

import { useRequiredPoolsForInteraction } from "./useRequiredPoolsForInteraction";

export const useRequiredTokensForInteraction = (
  interaction: Interaction,
): readonly TokenSpec[] => {
  const config = useConfig();
  const tokensByPoolId = getTokensByPool(config);
  const pools = useRequiredPoolsForInteraction(interaction);
  return getRequiredTokens(tokensByPoolId, pools, interaction);
};
