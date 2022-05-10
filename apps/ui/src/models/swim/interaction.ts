import type { Keypair } from "@solana/web3.js";
import type Decimal from "decimal.js";

import type { Env, PoolSpec } from "../../config";
import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";
import type { PoolMath } from "./poolMath";

export type AmountsByTokenId = ReadonlyMap<string, Amount>;

/**
 * Essentially a duplicate of SwimDefiInstruction but conceptually distinct because a swap
 * interaction may involve multiple instructions
 */
export enum InteractionType {
  Swap,
  Add,
  RemoveUniform,
  RemoveExactBurn,
  RemoveExactOutput,
}

interface BaseInteractionSpec {
  readonly type: InteractionType;
  readonly poolMaths: readonly PoolMath[];
  /** Should be overriden when extending this type */
  readonly params: unknown;
}

export interface SwapInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Swap;
  readonly params: {
    readonly exactInputAmounts: AmountsByTokenId;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: Amount;
  };
}

export interface AddInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Add;
  readonly poolId: string;
  readonly params: {
    readonly inputAmounts: AmountsByTokenId;
    readonly minimumMintAmount: Amount;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface RemoveUniformInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveUniform;
  readonly poolId: string;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: AmountsByTokenId;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactBurnInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactBurn;
  readonly poolId: string;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: Amount;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactOutputInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactOutput;
  readonly poolId: string;
  readonly params: {
    readonly maximumBurnAmount: Amount;
    readonly exactOutputAmounts: AmountsByTokenId;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export type InteractionSpec =
  | SwapInteractionSpec
  | AddInteractionSpec
  | RemoveUniformInteractionSpec
  | RemoveExactBurnInteractionSpec
  | RemoveExactOutputInteractionSpec;

interface BaseInteraction {
  readonly id: string;
  // TODO: Make less redundant with poolId on non-Swap InteractionSpecs
  readonly poolIds: readonly string[];
  readonly env: Env;
  readonly submittedAt: number;
  /** Record of token ID to keypairs for a signature set used in posting Wormhole VAAs to Solana */
  readonly signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>;
  /** Previous keypairs for use finding txs */
  readonly previousSignatureSetAddresses: ReadonlyRecord<
    string,
    string | undefined
  >;
  readonly connectedWallets: ReadonlyRecord<EcosystemId, string | null>;
}

export interface AddInteraction extends BaseInteraction, AddInteractionSpec {}

export interface RemoveUniformInteraction
  extends BaseInteraction,
    RemoveUniformInteractionSpec {}

export interface RemoveExactBurnInteraction
  extends BaseInteraction,
    RemoveExactBurnInteractionSpec {}

export interface RemoveExactOutputInteraction
  extends BaseInteraction,
    RemoveExactOutputInteractionSpec {}

export interface SwapInteraction extends BaseInteraction, SwapInteractionSpec {}

export type Interaction =
  | AddInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction
  | SwapInteraction;

export const createOperationSpecs = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
): readonly OperationSpec[] => {
  const { id: interactionId, poolMaths } = interaction;
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
              (token) => inputAmounts.get(token.id) ?? Amount.zero(token),
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
                minimumOutputAmounts.get(token.id) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.RemoveExactBurn: {
      const { exactBurnAmount, outputTokenId, minimumOutputAmount } =
        interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount,
            outputTokenIndex: inputPoolTokens.tokens.findIndex(
              (token) => token.id === outputTokenId,
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
              (token) => exactOutputAmounts.get(token.id) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.Swap: {
      const { exactInputAmounts, outputTokenId, minimumOutputAmount } =
        interaction.params;
      if (inputPool.id === outputPool.id) {
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === outputTokenId,
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
        const minimumMintAmount = Amount.fromAtomic(
          inputPoolTokens.lpToken,
          stableInputAmount,
          EcosystemId.Solana,
        );
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Add,
            params: {
              inputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
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
        const inputPoolMinimumOutputAmount = Amount.fromAtomic(
          outputPoolTokens.lpToken,
          lpInputAmount,
          EcosystemId.Solana,
        );
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
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
                (token) => token.id === outputTokenId,
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
        (token) => token.id === inputPool.lpToken,
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
      const minimumInputPoolOutputAmount = Amount.fromAtomic(
        inputPoolTokens.lpToken,
        stableInputAmount,
        EcosystemId.Solana,
      );
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Swap,
          params: {
            exactInputAmounts: inputPoolTokens.tokens.map(
              (token) => exactInputAmounts.get(token.id) ?? Amount.zero(token),
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
              (token) => token.id === outputTokenId,
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
