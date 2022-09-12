import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import type Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import { sum } from "../../amounts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { TokenOption } from "../../models";
import { getRequiredPoolsForSwapV2 } from "../../models";

import { usePoolBalances } from "./usePoolBalances";
import { useSwapOutputAmountEstimateV2 } from "./useSwapOutputAmountEstimateV2";

export const useIsLargeSwapV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
  inputAmount: Decimal,
) => {
  const config = useEnvironment(selectConfig, shallow);
  const requiredPools = getRequiredPoolsForSwapV2(
    config.pools,
    fromTokenOption,
    toTokenOption,
  );
  const poolBalances = usePoolBalances(requiredPools);
  const outputAmount = useSwapOutputAmountEstimateV2(
    fromTokenOption,
    toTokenOption,
    inputAmount,
  );
  if (requiredPools.length === 0) {
    return false;
  }
  const inputBalance = sum(poolBalances[0]);
  const outputBalance = sum(poolBalances[poolBalances.length - 1]);
  return (
    (TOKEN_PROJECTS_BY_ID[fromTokenOption.tokenConfig.projectId].isStablecoin &&
      inputBalance !== null &&
      inputAmount.gt(inputBalance.mul(0.1))) ||
    (TOKEN_PROJECTS_BY_ID[toTokenOption.tokenConfig.projectId].isStablecoin &&
      outputBalance !== null &&
      outputAmount !== null &&
      outputAmount.gt(outputBalance.mul(0.1)))
  );
};
