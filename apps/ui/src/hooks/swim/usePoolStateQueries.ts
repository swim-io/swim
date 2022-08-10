import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { EcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { PoolState } from "../../models";
import { getEvmPoolState, getSolanaPoolState } from "../../models";
import { useEvmConnections } from "../evm";
import { useSolanaConnection } from "../solana";

export const usePoolStateQueries = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<PoolState | null, Error>[] => {
  const { env } = useEnvironment();
  const { tokens, routingContractAddress } = useEnvironment(
    selectConfig,
    shallow,
  );
  const solanaConnection = useSolanaConnection();
  const evmConnections = useEvmConnections();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: ["poolState", env, poolSpec.id],
      queryFn: async () => {
        if (poolSpec.ecosystem === EcosystemId.Solana) {
          return await getSolanaPoolState(solanaConnection, poolSpec);
        }
        return await getEvmPoolState(
          evmConnections,
          poolSpec,
          tokens,
          routingContractAddress[poolSpec.ecosystem],
        );
      },
    })),
  ) as readonly UseQueryResult<PoolState | null, Error>[];
};
