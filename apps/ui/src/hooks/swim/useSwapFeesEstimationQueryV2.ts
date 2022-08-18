import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";
import type { FeesEstimation, TokenOption } from "../../models";
import { ZERO_FEE } from "../../models";

export const useSwapFeesEstimationQueryV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
) => {
  const { env } = useEnvironment();
  const fromEcosystem = fromTokenOption.ecosystemId;
  const toEcosystem = toTokenOption.ecosystemId;
  return useQuery<FeesEstimation, Error>(
    [env, "useSwapFeesEstimationQueryV2", fromEcosystem, toEcosystem],
    // TODO: estimation fee logic
    () => ZERO_FEE,
  );
};
