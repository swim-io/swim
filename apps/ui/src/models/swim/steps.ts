import type PoolMath from "@swim-io/pool-math";
import { findOrThrow } from "@swim-io/utils";

import { EcosystemId } from "../../config";
import type { PoolSpec, TokenSpec } from "../../config";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type {
  Interaction,
  InteractionSpec,
  InteractionSpecV2,
  TokenOption,
} from "./interaction";
import { InteractionType } from "./interaction";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";

export const getRequiredTokens = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interactionSpec: InteractionSpec,
): readonly TokenSpec[] => {
  switch (interactionSpec.type) {
    case InteractionType.Add: {
      const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
      return [
        ...tokens.filter((token) => {
          const inputAmount =
            interactionSpec.params.inputAmounts.find(
              (amount) => amount.tokenId === token.id,
            ) ?? null;
          return inputAmount !== null && !inputAmount.isZero();
        }),
        lpToken,
      ];
    }
    case InteractionType.RemoveUniform: {
      const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
      return [
        ...tokens.filter((token) => {
          const outputAmount =
            interactionSpec.params.minimumOutputAmounts.find(
              (amount) => amount.tokenId === token.id,
            ) ?? null;
          return outputAmount !== null && !outputAmount.isZero();
        }),
        lpToken,
      ];
    }
    case InteractionType.RemoveExactBurn: {
      const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
      return [
        ...tokens.filter(
          (token) =>
            token.id === interactionSpec.params.minimumOutputAmount.tokenId,
        ),
        lpToken,
      ];
    }
    case InteractionType.RemoveExactOutput: {
      const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
      return [
        ...tokens.filter((token) => {
          const outputAmount =
            interactionSpec.params.exactOutputAmounts.find(
              (amount) => amount.tokenId === token.id,
            ) ?? null;
          return outputAmount !== null && !outputAmount.isZero();
        }),
        lpToken,
      ];
    }
    case InteractionType.Swap: {
      const inputPool = poolSpecs[0];
      const outputPool = poolSpecs[poolSpecs.length - 1];
      const inputTokenId = interactionSpec.params.exactInputAmount.tokenId;
      const inputToken = findOrThrow(
        tokensByPoolId[inputPool.id].tokens,
        (token) => token.id === inputTokenId,
      );
      const outputToken = findOrThrow(
        tokensByPoolId[outputPool.id].tokens,
        (token) =>
          token.id === interactionSpec.params.minimumOutputAmount.tokenId,
      );
      if (inputPool.id === outputPool.id) {
        return [inputToken, outputToken];
      }

      // TODO: Generalize to other routes
      const swimUSD = tokensByPoolId["hexapool"].lpToken;
      return [inputToken, swimUSD, outputToken];
    }
    default:
      throw new Error("Unsupported instruction");
  }
};

export const createOperationSpecs = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  poolMaths: readonly PoolMath[],
  interaction: Interaction,
): readonly OperationSpec[] => {
  const { id: interactionId } = interaction;
  const inputPool = poolSpecs[0];
  const outputPool = poolSpecs[poolSpecs.length - 1];
  const inputPoolTokens = tokensByPoolId[inputPool.id];
  const outputPoolTokens = tokensByPoolId[outputPool.id];

  switch (interaction.type) {
    case InteractionType.Add: {
      const { inputAmounts, minimumMintAmount } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Add,
          params: {
            inputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                inputAmounts.find((amount) => amount.tokenId === token.id) ??
                Amount.zero(token),
            ),
            minimumMintAmount,
          },
        },
      ];
    }
    case InteractionType.RemoveUniform: {
      const { exactBurnAmount, minimumOutputAmounts } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveUniform,
          params: {
            exactBurnAmount,
            minimumOutputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                minimumOutputAmounts.find(
                  (amount) => amount.tokenId === token.id,
                ) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.RemoveExactBurn: {
      const { exactBurnAmount, minimumOutputAmount } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount,
            outputTokenIndex: inputPoolTokens.tokens.findIndex(
              (token) => token.id === minimumOutputAmount.tokenId,
            ),
            minimumOutputAmount,
          },
        },
      ];
    }
    case InteractionType.RemoveExactOutput: {
      const { maximumBurnAmount, exactOutputAmounts } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactOutput,
          params: {
            maximumBurnAmount,
            exactOutputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                exactOutputAmounts.find(
                  (amount) => amount.tokenId === token.id,
                ) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.Swap: {
      const { exactInputAmount, minimumOutputAmount } = interaction.params;
      if (inputPool.id === outputPool.id) {
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map((token) =>
                token.id === exactInputAmount.tokenId
                  ? exactInputAmount
                  : Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === minimumOutputAmount.tokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      if (poolMaths.length !== 2) {
        throw new Error("Missing pool math");
      }
      // TODO: Generalize to other routes
      const hexapoolId = "hexapool";
      const inputPoolIsHexapool = inputPool.id === hexapoolId;
      const outputPoolIsHexapool = outputPool.id === hexapoolId;
      const outputPoolMath = poolMaths[1];

      // add-then-swap
      if (inputPoolIsHexapool) {
        const inputIndex = outputPoolTokens.tokens.findIndex(
          (token) => token.id === inputPool.lpToken,
        );
        const minimumOutputAmounts = outputPoolTokens.tokens.map((token) =>
          token.id === minimumOutputAmount.tokenId
            ? minimumOutputAmount
            : Amount.zero(token),
        );
        const { stableInputAmount } = outputPoolMath.swapExactOutput(
          inputIndex,
          minimumOutputAmounts.map((amount) =>
            amount.toHuman(EcosystemId.Solana),
          ),
        );
        const minimumMintAmount = Amount.fromHuman(
          inputPoolTokens.lpToken,
          stableInputAmount,
        );
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Add,
            params: {
              inputAmounts: inputPoolTokens.tokens.map((token) =>
                token.id === exactInputAmount.tokenId
                  ? exactInputAmount
                  : Amount.zero(token),
              ),
              minimumMintAmount,
            },
          },
          {
            interactionId,
            poolId: outputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: outputPoolTokens.tokens.map((token) =>
                // NOTE: This will be overriden when we know the correct amount
                // For now we set the amount to 1 to distinguish it from the others
                token.id === inputPoolTokens.lpToken.id
                  ? Amount.fromAtomicString(token, "1", EcosystemId.Solana)
                  : Amount.zero(token),
              ),
              outputTokenIndex: outputPoolTokens.tokens.findIndex(
                (token) => token.id === minimumOutputAmount.tokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      // swap-then-remove
      if (outputPoolIsHexapool) {
        const minimumOutputAmounts = outputPoolTokens.tokens.map((token) =>
          token.id === minimumOutputAmount.tokenId
            ? minimumOutputAmount
            : Amount.zero(token),
        );
        const { lpInputAmount } = outputPoolMath.removeExactOutput(
          minimumOutputAmounts.map((amount) =>
            amount.toHuman(EcosystemId.Solana),
          ),
        );
        const inputPoolMinimumOutputAmount = Amount.fromHuman(
          outputPoolTokens.lpToken,
          lpInputAmount,
        );
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map((token) =>
                token.id === exactInputAmount.tokenId
                  ? exactInputAmount
                  : Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === outputPool.lpToken,
              ),
              minimumOutputAmount: inputPoolMinimumOutputAmount,
            },
          },
          {
            interactionId,
            poolId: outputPool.id,
            instruction: SwimDefiInstruction.RemoveExactBurn,
            params: {
              // NOTE: This will be overriden when we know the correct amount
              exactBurnAmount: Amount.zero(outputPoolTokens.lpToken),
              outputTokenIndex: outputPoolTokens.tokens.findIndex(
                (token) => token.id === minimumOutputAmount.tokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      // swap-then-swap (Metapool to metapool)
      const inputPoolOutputTokenIndex = inputPoolTokens.tokens.findIndex(
        (inputPoolToken) =>
          outputPoolTokens.tokens.some(
            (outputPoolToken) => outputPoolToken.id === inputPoolToken.id,
          ),
      );
      const inputPoolOutputToken =
        inputPoolTokens.tokens[inputPoolOutputTokenIndex];
      const outputPoolInputIndex = outputPoolTokens.tokens.findIndex(
        (token) => token.id === inputPoolOutputToken.id,
      );
      const minimumOutputAmounts = outputPoolTokens.tokens.map((token) =>
        token.id === minimumOutputAmount.tokenId
          ? minimumOutputAmount
          : Amount.zero(token),
      );
      const { stableInputAmount } = outputPoolMath.swapExactOutput(
        outputPoolInputIndex,
        minimumOutputAmounts.map((amount) =>
          amount.toHuman(EcosystemId.Solana),
        ),
      );
      const minimumInputPoolOutputAmount = Amount.fromHuman(
        inputPoolTokens.lpToken,
        stableInputAmount,
      );
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Swap,
          params: {
            exactInputAmounts: inputPoolTokens.tokens.map((token) =>
              token.id === exactInputAmount.tokenId
                ? exactInputAmount
                : Amount.zero(token),
            ),
            outputTokenIndex: inputPoolOutputTokenIndex,
            minimumOutputAmount: minimumInputPoolOutputAmount,
          },
        },
        {
          interactionId,
          poolId: outputPool.id,
          instruction: SwimDefiInstruction.Swap,
          params: {
            exactInputAmounts: outputPoolTokens.tokens.map((token) =>
              // NOTE: This will be overriden when we know the correct amount
              // For now we set the amount to 1 to distinguish it from the others
              token.id === inputPoolOutputToken.id
                ? Amount.fromAtomicString(token, "1", EcosystemId.Solana)
                : Amount.zero(token),
            ),
            outputTokenIndex: outputPoolTokens.tokens.findIndex(
              (token) => token.id === minimumOutputAmount.tokenId,
            ),
            minimumOutputAmount,
          },
        },
      ];
    }
    default:
      throw new Error("Unknown interaction type");
  }
};

export const getRequiredPoolsForSwap = (
  poolSpecs: readonly PoolSpec[],
  inputTokenId: string,
  outputTokenId: string,
): readonly PoolSpec[] => {
  const legacyPools = poolSpecs.filter((pool) => pool.isLegacyPool);
  const singlePool =
    legacyPools.find((poolSpec) =>
      [inputTokenId, outputTokenId].every((tokenId) =>
        poolSpec.tokens.includes(tokenId),
      ),
    ) ?? null;
  if (singlePool !== null) {
    return [singlePool];
  }
  // NOTE: We assume a maximum of two pools
  // TODO: Handle swimUSD swaps
  const inputPool = findOrThrow(legacyPools, (poolSpec) =>
    poolSpec.tokens.includes(inputTokenId),
  );
  const outputPool = findOrThrow(legacyPools, (poolSpec) =>
    poolSpec.tokens.includes(outputTokenId),
  );
  return [inputPool, outputPool];
};

export const getRequiredPoolsForSwapV2 = (
  poolSpecs: readonly PoolSpec[],
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
): readonly PoolSpec[] => {
  const restructuredPools = poolSpecs.filter((pool) => !pool.isLegacyPool);
  const inputPool = findOrThrow(
    restructuredPools,
    (pool) =>
      pool.ecosystem === fromTokenOption.ecosystemId &&
      pool.tokens.includes(fromTokenOption.tokenId),
  );
  const outputPool = findOrThrow(
    restructuredPools,
    (pool) =>
      pool.ecosystem === toTokenOption.ecosystemId &&
      pool.tokens.includes(toTokenOption.tokenId),
  );
  if (inputPool === outputPool) {
    return [inputPool];
  }
  return [inputPool, outputPool];
};

/** Returns one or two pools involved in the interaction */
export const getRequiredPools = (
  poolSpecs: readonly PoolSpec[],
  interactionSpec: InteractionSpec | InteractionSpecV2,
): readonly PoolSpec[] => {
  switch (interactionSpec.type) {
    case InteractionType.Add:
    case InteractionType.RemoveUniform:
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput:
      return [
        findOrThrow(
          poolSpecs,
          (poolSpec) => poolSpec.id === interactionSpec.poolId,
        ),
      ];
    case InteractionType.Swap:
      return getRequiredPoolsForSwap(
        poolSpecs,
        interactionSpec.params.exactInputAmount.tokenId,
        interactionSpec.params.minimumOutputAmount.tokenId,
      );
    case InteractionType.SwapV2:
      return getRequiredPoolsForSwapV2(
        poolSpecs,
        interactionSpec.params.fromTokenDetail,
        interactionSpec.params.toTokenDetail,
      );
    default:
      throw new Error("Unknown interaction type");
  }
};
