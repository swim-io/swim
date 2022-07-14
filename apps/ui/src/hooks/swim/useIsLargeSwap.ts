import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import shallow from "zustand/shallow.js";

import type { TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { Amount } from "../../models";
import { getRequiredPoolsForSwap } from "../../models";

import { usePools } from "./usePools";
import { useSwapOutputAmountEstimate } from "./useSwapOutputAmountEstimate";

export const useIsLargeSwap = (
  fromToken: TokenSpec,
  toToken: TokenSpec,
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
  return (
    (fromToken.isStablecoin &&
      inputPoolUsdValue !== null &&
      inputAmount
        .toHuman(SOLANA_ECOSYSTEM_ID)
        .gt(inputPoolUsdValue.mul(0.1))) ||
    (toToken.isStablecoin &&
      outputPoolUsdValue !== null &&
      outputAmount !== null &&
      outputAmount.toHuman(SOLANA_ECOSYSTEM_ID).gt(outputPoolUsdValue.mul(0.1)))
  );
};
