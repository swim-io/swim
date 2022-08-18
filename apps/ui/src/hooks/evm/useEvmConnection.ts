import { EvmEcosystemId } from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";
import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { EvmConnection } from "../../models";

export const useEvmConnection = (
  ecosystemId: EvmEcosystemId,
): EvmConnection => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const chainSpec = findOrThrow(
    chains[Protocol.Evm],
    (chain) => chain.ecosystem === ecosystemId,
  );

  const queryClient = useQueryClient();
  const queryKey = [env, "evmConnection", ecosystemId];

  const connection =
    // used as context cache to avoid multiple instances
    queryClient.getQueryData<EvmConnection>(queryKey) ||
    (function createEvmConnection(): EvmConnection {
      const evmConnection = new EvmConnection(env, chainSpec);
      queryClient.setQueryData(queryKey, evmConnection);
      return evmConnection;
    })();

  return connection;
};

export const useEvmConnections = (): ReadonlyRecord<
  EvmEcosystemId,
  EvmConnection
> => ({
  [EvmEcosystemId.Ethereum]: useEvmConnection(EvmEcosystemId.Ethereum),
  [EvmEcosystemId.Bnb]: useEvmConnection(EvmEcosystemId.Bnb),
  [EvmEcosystemId.Avalanche]: useEvmConnection(EvmEcosystemId.Avalanche),
  [EvmEcosystemId.Polygon]: useEvmConnection(EvmEcosystemId.Polygon),
  [EvmEcosystemId.Aurora]: useEvmConnection(EvmEcosystemId.Aurora),
  [EvmEcosystemId.Fantom]: useEvmConnection(EvmEcosystemId.Fantom),
  [EvmEcosystemId.Karura]: useEvmConnection(EvmEcosystemId.Karura),
  [EvmEcosystemId.Acala]: useEvmConnection(EvmEcosystemId.Acala),
});
