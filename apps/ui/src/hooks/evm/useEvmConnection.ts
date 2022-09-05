import type { EvmEcosystemId } from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { EvmConnection } from "../../models";
import { getOrCreateEvmConnection } from "../../models";

export const useEvmConnections = (
  ecosystemIds: readonly EvmEcosystemId[],
): readonly EvmConnection[] => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const queryClient = useQueryClient();

  return ecosystemIds.map((ecosystemId) => {
    const chainSpec = findOrThrow(
      chains[Protocol.Evm],
      (chain) => chain.ecosystem === ecosystemId,
    );
    return getOrCreateEvmConnection(env, ecosystemId, chainSpec, queryClient);
  });
};

export const useEvmConnection = (ecosystemId: EvmEcosystemId): EvmConnection =>
  useEvmConnections([ecosystemId])[0];
