import { useQuery } from "react-query";
import shallow from "zustand/shallow.js";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { EvmConnection } from "../../models";
import { findOrThrow } from "../../utils";
import type { ReadonlyRecord } from "../../utils";

export const useEvmConnection = (
  ecosystemId: EvmEcosystemId,
): EvmConnection => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const chainSpec = findOrThrow(
    chains[Protocol.Evm],
    (chain) => chain.ecosystem === ecosystemId,
  );

  const createConnection = () => new EvmConnection(env, chainSpec);

  const query = useQuery(
    ["evmConnection", ecosystemId, env],
    createConnection,
    {
      initialData: createConnection,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  return query.data as EvmConnection;
};

export const useEvmConnections = (): ReadonlyRecord<
  EvmEcosystemId,
  EvmConnection
> => ({
  [EcosystemId.Ethereum]: useEvmConnection(EcosystemId.Ethereum),
  [EcosystemId.Bsc]: useEvmConnection(EcosystemId.Bsc),
  [EcosystemId.Avalanche]: useEvmConnection(EcosystemId.Avalanche),
  [EcosystemId.Polygon]: useEvmConnection(EcosystemId.Polygon),
  [EcosystemId.Aurora]: useEvmConnection(EcosystemId.Aurora),
  [EcosystemId.Fantom]: useEvmConnection(EcosystemId.Fantom),
  [EcosystemId.Karura]: useEvmConnection(EcosystemId.Karura),
  [EcosystemId.Acala]: useEvmConnection(EcosystemId.Acala),
});
