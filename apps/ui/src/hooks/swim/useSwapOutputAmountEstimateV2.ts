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

const getRequiredSwimUsdInputAmount = (
  toToken: TokenConfig,
  outputAmount: Decimal,
  poolSpec: PoolSpec,
  poolMath: PoolMath,
  poolTokens: PoolTokens,
): Decimal => {
  if (isSwimUsd(toToken)) {
    return outputAmount;
  }
  const outputAmounts = poolTokens.tokens.map((token) =>
    token.id === toToken.id ? outputAmount : ZERO,
  );
  if (poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID) {
    // Remove
    const { lpInputAmount } = poolMath.removeExactOutput(outputAmounts);
    return lpInputAmount;
  }
  // Swap
  const swimUsdIndex = poolTokens.tokens.findIndex(isSwimUsd);
  if (swimUsdIndex === -1) {
    throw new Error("SwimUsd not found");
  }
  const { stableInputAmount } = poolMath.swapExactOutput(
    swimUsdIndex,
    outputAmounts,
  );
  return stableInputAmount;
};

const getOutputAmount = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  inputAmount: Decimal,
  poolSpec: PoolSpec,
  poolMath: PoolMath,
  poolTokens: PoolTokens,
): Decimal => {
  if (inputAmount.isZero()) {
    return inputAmount;
  }
  if (isSwimUsd(fromToken) && isSwimUsd(toToken)) {
    // Transfer
    return inputAmount;
  }
  if (poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID && isSwimUsd(toToken)) {
    // Add
    const inputAmounts = poolTokens.tokens.map((token) =>
      token.id === fromToken.id ? inputAmount : ZERO,
    );
    const { lpOutputAmount } = poolMath.add(inputAmounts);
    return lpOutputAmount;
  }
  if (poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID && isSwimUsd(fromToken)) {
    // Remove
    const outputIndex = poolTokens.tokens.findIndex(
      (token) => token.id === toToken.id,
    );
    const { stableOutputAmount } = poolMath.removeExactBurn(
      inputAmount,
      outputIndex,
    );
    return stableOutputAmount;
  }
  // Swap
  const inputAmounts = poolTokens.tokens.map((token) =>
    token.id === fromToken.id ? inputAmount : ZERO,
  );
  const outputIndex = poolTokens.tokens.findIndex(
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

export const useSwapOutputAmountEstimateV2 = ({
  fromTokenOption,
  toTokenOption,
  inputAmount,
  maxSlippageFraction,
}: {
  readonly fromTokenOption: TokenOption;
  readonly toTokenOption: TokenOption;
  readonly inputAmount: Decimal;
  readonly maxSlippageFraction: Decimal | null;
}): {
  readonly swimUsdMinimumOutputAmount: Decimal | null;
  readonly minimumOutputAmount: Decimal | null;
} => {
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

  if (
    !isEachNotNull(poolMaths) ||
    swimUsdSpec === null ||
    maxSlippageFraction === null
  ) {
    return {
      swimUsdMinimumOutputAmount: null,
      minimumOutputAmount: null,
    };
  }

  if (requiredPools.length === 1) {
    const poolSpec = requiredPools[0];
    const poolMath = poolMaths[0];
    const outputAmount = getOutputAmount(
      fromToken,
      toToken,
      inputAmount,
      poolSpec,
      poolMath,
      tokensByPool[poolSpec.id],
    );
    return {
      swimUsdMinimumOutputAmount: null,
      minimumOutputAmount: outputAmount.sub(
        outputAmount.mul(maxSlippageFraction),
      ),
    };
  }

  if (requiredPools.length > 2) {
    throw new Error("Unexpected swap route");
  }
  const inputPool = requiredPools[0];
  const inputPoolMath = poolMaths[0];
  const outputPool = requiredPools[1];
  const outputPoolMath = poolMaths[1];

  const firstOutputAmount = getOutputAmount(
    fromToken,
    swimUsdSpec,
    inputAmount,
    inputPool,
    inputPoolMath,
    tokensByPool[inputPool.id],
  );
  const finalOutputAmount = getOutputAmount(
    swimUsdSpec,
    toToken,
    firstOutputAmount,
    outputPool,
    outputPoolMath,
    tokensByPool[outputPool.id],
  );
  const minimumOutputAmount = finalOutputAmount.sub(
    finalOutputAmount.mul(maxSlippageFraction),
  );
  const swimUsdMinimumOutputAmount = getRequiredSwimUsdInputAmount(
    toToken,
    minimumOutputAmount,
    outputPool,
    outputPoolMath,
    tokensByPool[outputPool.id],
  );
  return {
    swimUsdMinimumOutputAmount,
    minimumOutputAmount,
  };
};
