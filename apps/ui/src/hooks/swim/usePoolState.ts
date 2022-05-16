import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import type { PoolSpec } from "../../config";
import { useSolanaConnection } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";
import type { SwimPoolState } from "../../models";
import { getPoolState } from "../../models";

export const usePoolStates = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<SwimPoolState | null, Error>[] => {
  const env = useEnvironmentStore(selectEnv);
  const solanaConnection = useSolanaConnection();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: ["poolState", env, poolSpec.id],
      queryFn: async () => getPoolState(solanaConnection, poolSpec),
    })),
  ) as readonly UseQueryResult<SwimPoolState | null, Error>[];
};

export const usePoolState = (
  poolSpec: PoolSpec,
): UseQueryResult<SwimPoolState | null, Error> => {
  const env = useEnvironmentStore(selectEnv);
  const solanaConnection = useSolanaConnection();

  return useQuery<SwimPoolState | null, Error>(
    ["poolState", env, poolSpec.id],
    async () => getPoolState(solanaConnection, poolSpec),
  );
};
