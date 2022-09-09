import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isEachNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import type { TokenConfig } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import {
  Amount,
  SwimDefiInstruction,
  getRequiredPoolsForSwap,
  getTokensByPool,
} from "../../models";

import { usePoolMaths } from "./usePoolMaths";

interface PoolTokens {
  readonly tokens: readonly TokenConfig[];
  readonly lpToken: TokenConfig;
}

const ZERO = new Decimal(0);

const ensureNonNegative = (amount: Amount): Amount => {
  const zero = Amount.zero(amount.tokenConfig);
  return amount.gt(zero) ? amount : zero;
};

const routeSwap = (
  inputPoolTokens: PoolTokens,
  outputPoolTokens: PoolTokens,
  toToken: TokenConfig,
): {
  readonly inputPoolInstruction:
    | SwimDefiInstruction.Add
    | SwimDefiInstruction.Swap;
  readonly inputPoolOutputTokenIndex: number | null;
  readonly outputPoolInstruction:
    | SwimDefiInstruction.Swap
    | SwimDefiInstruction.RemoveExactBurn
    | null;
  readonly outputPoolInputToken: TokenConfig | null;
} => {
  if (inputPoolTokens.lpToken.id === outputPoolTokens.lpToken.id) {
    const inputPoolIndexOfToToken = inputPoolTokens.tokens.findIndex(
      (token) => token.id === toToken.id,
    );
    if (inputPoolIndexOfToToken === -1) {
      throw new Error("Invalid swap route");
    }
    return {
      inputPoolInstruction: SwimDefiInstruction.Swap,
      inputPoolOutputTokenIndex: inputPoolIndexOfToToken,
      outputPoolInstruction: null,
      outputPoolInputToken: null,
    };
  }
  if (
    outputPoolTokens.tokens.some(
      (token) => token.id === inputPoolTokens.lpToken.id,
    )
  ) {
    return {
      inputPoolInstruction: SwimDefiInstruction.Add,
      inputPoolOutputTokenIndex: null,
      outputPoolInstruction: SwimDefiInstruction.Swap,
      outputPoolInputToken: inputPoolTokens.lpToken,
    };
  }
  const inputPoolIndexOfOutputPoolLpToken = inputPoolTokens.tokens.findIndex(
    (token) => token.id === outputPoolTokens.lpToken.id,
  );
  if (inputPoolIndexOfOutputPoolLpToken !== -1) {
    return {
      inputPoolInstruction: SwimDefiInstruction.Swap,
      inputPoolOutputTokenIndex: inputPoolIndexOfOutputPoolLpToken,
      outputPoolInstruction: SwimDefiInstruction.RemoveExactBurn,
      outputPoolInputToken: outputPoolTokens.lpToken,
    };
  }
  const inputPoolIndexOfSharedToken = inputPoolTokens.tokens.findIndex(
    (inputPoolToken) =>
      outputPoolTokens.tokens.some(
        (outputPoolToken) => outputPoolToken.id === inputPoolToken.id,
      ),
  );
  if (inputPoolIndexOfSharedToken === -1) {
    throw new Error("Invalid swap route");
  }
  return {
    inputPoolInstruction: SwimDefiInstruction.Swap,
    inputPoolOutputTokenIndex: inputPoolIndexOfSharedToken,
    outputPoolInstruction: SwimDefiInstruction.Swap,
    outputPoolInputToken: inputPoolTokens.tokens[inputPoolIndexOfSharedToken],
  };
};

export const useSwapOutputAmountEstimate = (
  exactInputAmount: Amount,
  toToken: TokenConfig,
): Amount | null => {
  const config = useEnvironment(selectConfig, shallow);
  const fromToken = exactInputAmount.tokenConfig;
  const tokensByPool = getTokensByPool(config);
  const requiredPools = getRequiredPoolsForSwap(
    config.pools,
    fromToken.id,
    toToken.id,
  );
  const poolIds = requiredPools.map((pool) => pool.id);
  const poolMaths = usePoolMaths(poolIds);
  const inputPool = requiredPools[0];
  const outputPool = requiredPools[requiredPools.length - 1];
  const inputPoolTokens = tokensByPool[inputPool.id];
  const outputPoolTokens = tokensByPool[outputPool.id];

  if (
    poolMaths.length < 1 ||
    poolMaths.length > 2 ||
    !isEachNotNull(poolMaths)
  ) {
    return null;
  }

  const inputPoolMath = poolMaths[0];
  const {
    inputPoolInstruction,
    inputPoolOutputTokenIndex,
    outputPoolInstruction,
    outputPoolInputToken,
  } = routeSwap(inputPoolTokens, outputPoolTokens, toToken);

  // Calculate input pool output amount
  let inputPoolOutputAmount: Amount | null = null;
  try {
    switch (inputPoolInstruction) {
      case SwimDefiInstruction.Add: {
        if (outputPoolInputToken === null) {
          throw new Error("Invalid swap route");
        }
        const { lpOutputAmount } = inputPoolMath.add(
          inputPoolTokens.tokens.map((token) =>
            token.id === exactInputAmount.tokenId
              ? exactInputAmount.toHuman(SOLANA_ECOSYSTEM_ID)
              : ZERO,
          ),
        );
        inputPoolOutputAmount = Amount.fromHuman(
          outputPoolInputToken,
          lpOutputAmount,
        );
        break;
      }
      case SwimDefiInstruction.Swap: {
        if (inputPoolOutputTokenIndex === null) {
          throw new Error("Invalid swap route");
        }
        const { stableOutputAmount } = inputPoolMath.swapExactInput(
          inputPoolTokens.tokens.map((token) =>
            token.id === exactInputAmount.tokenId
              ? exactInputAmount.toHuman(SOLANA_ECOSYSTEM_ID)
              : ZERO,
          ),
          inputPoolOutputTokenIndex,
        );
        inputPoolOutputAmount = ensureNonNegative(
          Amount.fromHuman(
            inputPoolTokens.tokens[inputPoolOutputTokenIndex],
            stableOutputAmount,
          ),
        );
        break;
      }
      default:
        throw new Error("Unknown swap route");
    }
  } catch {
    return null;
  }

  if (poolMaths.length === 1) {
    return inputPoolOutputAmount;
  }

  // Calculate output pool output amount for multi-pool swaps
  const outputPoolMath = poolMaths[1];
  const outputPoolOutputTokenIndex = outputPoolTokens.tokens.findIndex(
    ({ id }) => id === toToken.id,
  );
  try {
    switch (outputPoolInstruction) {
      case SwimDefiInstruction.RemoveExactBurn: {
        const { stableOutputAmount } = outputPoolMath.removeExactBurn(
          inputPoolOutputAmount.toHuman(SOLANA_ECOSYSTEM_ID),
          outputPoolOutputTokenIndex,
        );
        return ensureNonNegative(Amount.fromHuman(toToken, stableOutputAmount));
      }
      case SwimDefiInstruction.Swap: {
        const { stableOutputAmount } = outputPoolMath.swapExactInput(
          outputPoolTokens.tokens.map((token) => {
            if (inputPoolOutputAmount === null) {
              throw new Error("Something went wrong");
            }
            const amount =
              token.id === inputPoolOutputAmount.tokenId
                ? inputPoolOutputAmount
                : Amount.zero(token);
            return amount.toHuman(SOLANA_ECOSYSTEM_ID);
          }),
          outputPoolOutputTokenIndex,
        );
        return ensureNonNegative(Amount.fromHuman(toToken, stableOutputAmount));
      }
      default:
        throw new Error("Unknown swap route");
    }
  } catch {
    return null;
  }
};
