import shallow from "zustand/shallow";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
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
      inputAmount.toHuman(EcosystemId.Solana).gt(inputPoolUsdValue.mul(0.1))) ||
    (toToken.isStablecoin &&
      outputPoolUsdValue !== null &&
      outputAmount !== null &&
      outputAmount.toHuman(EcosystemId.Solana).gt(outputPoolUsdValue.mul(0.1)))
  );
};
