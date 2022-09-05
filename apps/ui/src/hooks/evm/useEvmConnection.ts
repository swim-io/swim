import type { EvmEcosystemId } from "@swim-io/evm";
import { useContext } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { EvmConnectionsContext } from "../../contexts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { EvmConnection } from "../../models";
import { getOrCreateEvmConnection } from "../../models";

export const useEvmConnections = (
  ecosystemIds: readonly EvmEcosystemId[],
): readonly EvmConnection[] => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const evmConnections = useContext(EvmConnectionsContext);
  return ecosystemIds.map(
    getOrCreateEvmConnection.bind(
      null,
      evmConnections,
      chains[Protocol.Evm],
      env,
    ),
  );
};

export const useEvmConnection = (ecosystemId: EvmEcosystemId): EvmConnection =>
  useEvmConnections([ecosystemId])[0];

export const useGetEvmConnection = (): ((
  ecosystemId: EvmEcosystemId,
) => EvmConnection) => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const evmConnections = useContext(EvmConnectionsContext);
  return getOrCreateEvmConnection.bind(
    null,
    evmConnections,
    chains[Protocol.Evm],
    env,
  );
};
