import type PoolMath from "@swim-io/pool-math";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isEachNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenConfig } from "../../config";
import { isSwimUsd } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { TokenOption } from "../../models";
import { getRequiredPoolsForSwapV2, getTokensByPool } from "../../models";

import { usePoolMaths } from "./usePoolMaths";
import { useSwimUsd } from "./useSwimUsd";

interface PoolTokens {
  readonly tokens: readonly TokenConfig[];
  readonly lpToken: TokenConfig;
}

const ZERO = new Decimal(0);

const getOutputAmount = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  inputAmount: Decimal,
  poolSpec: PoolSpec,
  poolMath: PoolMath,
  poolToken: PoolTokens,
) => {
  if (inputAmount.isZero()) {
    return inputAmount;
  }
  if (isSwimUsd(fromToken) && isSwimUsd(toToken)) {
    // Transfer
    return inputAmount;
  }
  if (poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID && isSwimUsd(toToken)) {
    // Add
    const inputAmounts = poolToken.tokens.map((token) =>
      token.id === fromToken.id ? inputAmount : ZERO,
    );
    const { lpOutputAmount } = poolMath.add(inputAmounts);
    return lpOutputAmount;
  }
  if (poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID && isSwimUsd(fromToken)) {
    // Remove
    const outputIndex = poolToken.tokens.findIndex(
      (token) => token.id === toToken.id,
    );
    const { stableOutputAmount } = poolMath.removeExactBurn(
      inputAmount,
      outputIndex,
    );
    return stableOutputAmount;
  }
  // Swap
  const inputAmounts = poolToken.tokens.map((token) =>
    token.id === fromToken.id ? inputAmount : ZERO,
  );
  const outputIndex = poolToken.tokens.findIndex(
    (token) => token.id === toToken.id,
  );
  if (outputIndex === -1) {
    throw new Error("Invalid swap route");
  }
  const { stableOutputAmount } = poolMath.swapExactInput(
    inputAmounts,
    outputIndex,
  );
  return stableOutputAmount;
};

export const useSwapOutputAmountEstimateV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
  inputAmount: Decimal,
): Decimal | null => {
  const config = useEnvironment(selectConfig, shallow);
  const tokensByPool = getTokensByPool(config);
  const requiredPools = getRequiredPoolsForSwapV2(
    config.pools,
    fromTokenOption,
    toTokenOption,
  );
  const poolIds = requiredPools.map((pool) => pool.id);
  const poolMaths = usePoolMaths(poolIds);
  const fromToken = fromTokenOption.tokenConfig;
  const toToken = toTokenOption.tokenConfig;
  const swimUsdSpec = useSwimUsd();

  if (!isEachNotNull(poolMaths)) {
    return null;
  }

  if (requiredPools.length === 0) {
    return inputAmount;
  }

  if (requiredPools.length === 1) {
    const poolSpec = requiredPools[0];
    const poolMath = poolMaths[0];
    return getOutputAmount(
      fromToken,
      toToken,
      inputAmount,
      poolSpec,
      poolMath,
      tokensByPool[poolSpec.id],
    );
  }

  if (requiredPools.length > 2) {
    throw new Error("Unexpected swap route");
  }
  const inputPool = requiredPools[0];
  const inputPoolMath = poolMaths[0];
  const outputPool = requiredPools[1];
  const outputPoolMath = poolMaths[1];

  const swimUsdAmount = getOutputAmount(
    fromToken,
    swimUsdSpec,
    inputAmount,
    inputPool,
    inputPoolMath,
    tokensByPool[inputPool.id],
  );
  return getOutputAmount(
    swimUsdSpec,
    toToken,
    swimUsdAmount,
    outputPool,
    outputPoolMath,
    tokensByPool[outputPool.id],
  );
};
