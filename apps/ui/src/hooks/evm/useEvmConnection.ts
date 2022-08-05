import { findOrThrow } from "@swim-io/utils";
import type { ReadonlyRecord } from "@swim-io/utils";
import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, Protocol } from "../../config";
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
  [EcosystemId.Ethereum]: useEvmConnection(EcosystemId.Ethereum),
  [EcosystemId.Bnb]: useEvmConnection(EcosystemId.Bnb),
  [EcosystemId.Avalanche]: useEvmConnection(EcosystemId.Avalanche),
  [EcosystemId.Polygon]: useEvmConnection(EcosystemId.Polygon),
  [EcosystemId.Aurora]: useEvmConnection(EcosystemId.Aurora),
  [EcosystemId.Fantom]: useEvmConnection(EcosystemId.Fantom),
  [EcosystemId.Karura]: useEvmConnection(EcosystemId.Karura),
  [EcosystemId.Acala]: useEvmConnection(EcosystemId.Acala),
});
