import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { PoolState } from "../../models";
import { getEvmPoolState, getSolanaPoolState } from "../../models";
import { useGetEvmConnection } from "../evm";
import { useSolanaConnection } from "../solana";

export const usePoolStateQueries = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<PoolState | null, Error>[] => {
  const { env } = useEnvironment();
  const { tokens, evmRoutingContract } = useEnvironment(selectConfig, shallow);
  const getEvmConnection = useGetEvmConnection();
  const solanaConnection = useSolanaConnection();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: [env, "poolState", poolSpec.id],
      queryFn: async () => {
        const { ecosystem } = poolSpec;
        if (ecosystem === SOLANA_ECOSYSTEM_ID) {
          return await getSolanaPoolState(solanaConnection, poolSpec);
        }
        if (ecosystem === APTOS_ECOSYSTEM_ID) {
          return null; // TODO aptos
        }
        const evmConnection = getEvmConnection(ecosystem);
        return await getEvmPoolState(
          evmConnection,
          poolSpec,
          tokens,
          evmRoutingContract,
        );
      },
    })),
  ) as readonly UseQueryResult<PoolState | null, Error>[];
};
