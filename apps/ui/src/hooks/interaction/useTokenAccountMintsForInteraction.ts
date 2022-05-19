import { getSolanaTokenDetails } from "../../config";

import { useRequiredTokensForInteraction } from "./useRequiredTokensForInteraction";

export const useTokenAccountMintsForInteraction = (
  interactionId: string,
): readonly string[] => {
  const requiredTokens = useRequiredTokensForInteraction(interactionId);
  return requiredTokens.map((token) => getSolanaTokenDetails(token).address);
};
