import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EVM_ECOSYSTEMS } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import type { PoolSpec } from "../../config";
import { useEnvironment } from "../../core/store";
import type { PoolState } from "../../models";
import { getLegacySolanaPoolState } from "../../models";
import { useGetEvmClient } from "../evm";
import { useSolanaClient } from "../solana";

export const usePoolStateQueries = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<PoolState | null, Error>[] => {
  const { env } = useEnvironment();
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: [env, "poolState", poolSpec.id],
      queryFn: async () => {
        const { ecosystem } = poolSpec;
        if (ecosystem === SOLANA_ECOSYSTEM_ID) {
          if (poolSpec.isLegacyPool) {
            return await getLegacySolanaPoolState(solanaClient, poolSpec);
          }
          return await solanaClient.getPoolState(poolSpec.id);
        }
        if (ecosystem === APTOS_ECOSYSTEM_ID) {
          return null; // TODO aptos
        }
        const evmClient = getEvmClient(ecosystem);
        const routingContractAddress =
          EVM_ECOSYSTEMS[ecosystem].chains[env]?.routingContractAddress ?? null;
        if (routingContractAddress === null) {
          return null;
        }
        return await evmClient.getPoolState(poolSpec.id);
      },
    })),
  ) as readonly UseQueryResult<PoolState | null, Error>[];
};
