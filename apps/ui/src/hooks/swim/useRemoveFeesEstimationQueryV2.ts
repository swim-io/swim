import { useQuery, useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import type { FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  ZERO_FEE,
  getGasPrice,
} from "../../models";
import { useEvmConnections } from "../evm";

export const useRemoveFeesEstimationQueryV2 = (poolEcosystem: EcosystemId) => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const evmConnections = useEvmConnections();

  return useQuery<FeesEstimation, Error>(
    [env, "useRemoveFeesEstimationQueryV2", poolEcosystem],
    async () => {
      if (poolEcosystem === EcosystemId.Solana) {
        return {
          ...ZERO_FEE,
          [poolEcosystem]: SOLANA_FEE,
        };
      }
      const gasPrice = await getGasPrice(
        env,
        queryClient,
        poolEcosystem,
        evmConnections,
      );
      return {
        ...ZERO_FEE,
        [poolEcosystem]: gasPrice.mul(APPROVAL_CEILING + REDEEM_CEILING),
      };
    },
  );
};
