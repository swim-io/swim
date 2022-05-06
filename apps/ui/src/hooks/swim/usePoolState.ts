import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { PoolSpec } from "../../config";
import { useEnvironment, useSolanaConnection } from "../../contexts";
import type { SwimPoolState } from "../../models";
import { getPoolState } from "../../models";

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
