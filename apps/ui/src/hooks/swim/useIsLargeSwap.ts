import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import shallow from "zustand/shallow.js";

import type { TokenConfig } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { Amount } from "../../models";
import { getRequiredPoolsForSwap } from "../../models";

import { usePools } from "./usePools";
import { useSwapOutputAmountEstimate } from "./useSwapOutputAmountEstimate";

export const useIsLargeSwap = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  inputAmount: Amount,
) => {
  const config = useEnvironment(selectConfig, shallow);
  const requiredPools = getRequiredPoolsForSwap(
    config.pools,
    fromToken.id,
    toToken.id,
  );
  const poolIds = requiredPools.map((pool) => pool.id);
  const pools = usePools(poolIds);
  const inputPoolUsdValue = pools[0].poolUsdValue;
  const outputPoolUsdValue = pools[pools.length - 1].poolUsdValue;
  const outputAmount = useSwapOutputAmountEstimate(inputAmount, toToken);
  const fromTokenProject = TOKEN_PROJECTS_BY_ID[fromToken.projectId];
  const toTokenProject = TOKEN_PROJECTS_BY_ID[toToken.projectId];
  return (
    ((fromTokenProject.isStablecoin || fromTokenProject.isSwimUsd) &&
      inputPoolUsdValue !== null &&
      inputAmount
        .toHuman(SOLANA_ECOSYSTEM_ID)
        .gt(inputPoolUsdValue.mul(0.1))) ||
    ((toTokenProject.isStablecoin || toTokenProject.isSwimUsd) &&
      outputPoolUsdValue !== null &&
      outputAmount !== null &&
      outputAmount.toHuman(SOLANA_ECOSYSTEM_ID).gt(outputPoolUsdValue.mul(0.1)))
  );
};
