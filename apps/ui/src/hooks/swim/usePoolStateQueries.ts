import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EVM_ECOSYSTEMS } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { PoolState } from "../../models";
import { getEvmPoolState, getSolanaPoolState } from "../../models";
import { useGetEvmClient } from "../evm";
import { useSolanaClient } from "../solana";

export const usePoolStateQueries = (
  poolSpecs: readonly PoolSpec[],
): readonly UseQueryResult<PoolState | null, Error>[] => {
  const { env } = useEnvironment();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const getEvmConnection = useGetEvmClient();
  const solanaClient = useSolanaClient();

  return useQueries(
    poolSpecs.map((poolSpec) => ({
      queryKey: [env, "poolState", poolSpec.id],
      queryFn: async () => {
        const { ecosystem } = poolSpec;
        if (ecosystem === SOLANA_ECOSYSTEM_ID) {
          return await getSolanaPoolState(solanaClient, poolSpec);
        }
        if (ecosystem === APTOS_ECOSYSTEM_ID) {
          return null; // TODO aptos
        }
        const evmConnection = getEvmConnection(ecosystem);
        const routingContractAddress =
          EVM_ECOSYSTEMS[ecosystem].chains[env]?.routingContractAddress ?? null;
        if (routingContractAddress === null) {
          return null;
        }
        return await getEvmPoolState(
          evmConnection,
          poolSpec,
          tokens,
          routingContractAddress,
        );
      },
    })),
  ) as readonly UseQueryResult<PoolState | null, Error>[];
};
