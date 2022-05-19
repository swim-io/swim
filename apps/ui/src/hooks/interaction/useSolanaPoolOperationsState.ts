import { useConfig } from "../../contexts";
import { createOperationSpecs, getTokensByPool } from "../../models";
import { isNotNull } from "../../utils";
import { usePoolMaths } from "../swim";

import { useInteraction } from "./useInteraction";
import type { SolanaPoolOperationState } from "./useInteractionState";
import { useRequiredPoolsForInteraction } from "./useRequiredPoolsForInteraction";

export const useSolanaPoolOperationState = (
  interactionId: string,
): readonly SolanaPoolOperationState[] => {
  const config = useConfig();
  const tokensByPoolId = getTokensByPool(config);
  const interaction = useInteraction(interactionId);
  const pools = useRequiredPoolsForInteraction(interactionId);
  const poolMaths = usePoolMaths(pools.map(({ id }) => id)).filter(isNotNull);
  const operationSpecs = createOperationSpecs(
    tokensByPoolId,
    pools,
    poolMaths,
    interaction,
  );
  return operationSpecs.map((operation) => ({
    operation,
    tx: null,
  }));
};
