import { useQuery } from "react-query";

import type { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import type { Amount, FeesEstimation } from "../../models";
import { ZERO_FEE } from "../../models";

export const useAddFeesEstimationQueryV2 = (
  amounts: readonly (Amount | null)[],
  poolEcosystem: EcosystemId,
) => {
  const { env } = useEnvironment();
  const nonZeroTokenCount = amounts.filter(
    (amount) => amount !== null && !amount.isZero(),
  ).length;

  return useQuery<FeesEstimation, Error>(
    [env, "useAddFeesEstimationQueryV2", poolEcosystem, nonZeroTokenCount],
    () => ZERO_FEE,
  );
};
