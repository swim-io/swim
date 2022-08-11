import type { SwimPoolState } from "@swim-io/solana-types";
import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import type { PoolSpec } from "../../config";
import { useSolanaConnection } from "../../contexts/SolanaConnection";
import { useEnvironment } from "../../core/store";
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
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
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
