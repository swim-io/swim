import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { getRequiredTokens, getTokensByPool } from "../../models";

import { useInteraction } from "./useInteraction";
import { useRequiredPoolsForInteraction } from "./useRequiredPoolsForInteraction";

export const useRequiredTokensForInteraction = (
  interactionId: string,
): readonly TokenSpec[] => {
  const config = useEnvironment(selectConfig, shallow);
  const tokensByPoolId = getTokensByPool(config);
  const interaction = useInteraction(interactionId);
  const pools = useRequiredPoolsForInteraction(interactionId);
  return getRequiredTokens(tokensByPoolId, pools, interaction);
};
