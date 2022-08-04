import { useQuery, useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import type { Amount, FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
  ZERO_FEE,
  getGasPrice,
} from "../../models";
import { useEvmConnections } from "../evm";

export const useAddFeesEstimationQueryV2 = (
  amounts: readonly (Amount | null)[],
  poolEcosystem: EcosystemId,
) => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const evmConnections = useEvmConnections();

  const nonZeroTokenCount = amounts.filter(
    (amount) => amount !== null && !amount.isZero(),
  ).length;

  return useQuery<FeesEstimation, Error>(
    [env, "useAddFeesEstimationQueryV2", poolEcosystem, nonZeroTokenCount],
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
        [poolEcosystem]: gasPrice.mul(
          nonZeroTokenCount * APPROVAL_CEILING + TRANSFER_CEILING,
        ),
      };
    },
  );
};
