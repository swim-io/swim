import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import type { PoolSpec } from "../../config";
import { useEnvironment, useSolanaConnection } from "../../contexts";
import type { SwimPoolState } from "../../models";
import { getPoolState } from "../../models";

export const usePoolStates = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<SwimPoolState | null, Error>[] => {
  const { env } = useEnvironment();
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
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();

  return useQuery<SwimPoolState | null, Error>(
    ["poolState", env, poolSpec.id],
    async () => getPoolState(solanaConnection, poolSpec),
  );
};
