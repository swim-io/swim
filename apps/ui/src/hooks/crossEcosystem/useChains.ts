import shallow from "zustand/shallow.js";

import type { ChainConfig, EcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useChains = (
  ecosystemIds: readonly EcosystemId[],
): readonly (ChainConfig | null)[] => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  return ecosystemIds.map((ecosystemId) => {
    const ecosystem = ecosystems.find(({ id }) => id === ecosystemId);
    return ecosystem?.chain ?? null;
  });
};

export const useChain = (ecosystemId: EcosystemId): ChainConfig | null => {
  const [chain] = useChains([ecosystemId]);
  return chain;
};
