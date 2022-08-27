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
import { useToken } from "./useToken";

export const useIsLargeSwapV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
  inputAmount: Decimal,
) => {
  const config = useEnvironment(selectConfig, shallow);
  const fromToken = useToken(fromTokenOption.tokenId);
  const toToken = useToken(toTokenOption.tokenId);
  const requiredPools = getRequiredPoolsForSwapV2(
    config.pools,
    fromTokenOption,
    toTokenOption,
  );
  const poolBalances = usePoolBalances(requiredPools);
  const inputBalance = sum(poolBalances[0]);
  const outputBalance = sum(poolBalances[poolBalances.length - 1]);
  const outputAmount = useSwapOutputAmountEstimateV2(
    fromTokenOption,
    toTokenOption,
    inputAmount,
  );
  return (
    (TOKEN_PROJECTS_BY_ID[fromToken.projectId].isStablecoin &&
      inputBalance !== null &&
      inputAmount.gt(inputBalance.mul(0.1))) ||
    (TOKEN_PROJECTS_BY_ID[toToken.projectId].isStablecoin &&
      outputBalance !== null &&
      outputAmount !== null &&
      outputAmount.gt(outputBalance.mul(0.1)))
  );
};
