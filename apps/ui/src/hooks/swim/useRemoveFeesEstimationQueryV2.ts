import { useQuery } from "react-query";

import type { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import type { FeesEstimation } from "../../models";
import { ZERO_FEE } from "../../models";

export const useRemoveFeesEstimationQueryV2 = (poolEcosystem: EcosystemId) => {
  const { env } = useEnvironment();
  return useQuery<FeesEstimation, Error>(
    [env, "useRemoveFeesEstimationQueryV2", poolEcosystem],
    () => ZERO_FEE,
  );
};
