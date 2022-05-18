import type { AccountInfo as TokenAccount } from "@solana/spl-token";

import { EcosystemId, getSolanaTokenDetails } from "../../config";
import type {
  ChainsByProtocol,
  Config,
  PoolSpec,
  TokenSpec,
} from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { findOrThrow } from "../../utils";
import { Amount } from "../amount";
import type {
  SolanaTx,
  Tx,
  TxsByPoolId,
  TxsByTokenId,
} from "../crossEcosystem";
import { isSolanaTx } from "../crossEcosystem";
import { findTokenAccountForMint } from "../solana";
import { isTransferFromTx, isTransferToTx } from "../wormhole";

import { SwimDefiInstruction } from "./instructions";
import type {
  AddInteraction,
  Interaction,
  InteractionSpec,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
} from "./interaction";
import { InteractionType } from "./interaction";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";
import { getTokensByPool, isPoolTx } from "./pool";
import type { PoolMath } from "./poolMath";
import type {
  ProtoTransfer,
  Transfer,
  TransferToSolana,
  Transfers,
} from "./transfer";
import {
  TransferType,
  generateInputTransfers,
  generateLpInTransfer,
  generateLpOutProtoTransfer,
  generateOutputProtoTransfers,
  generateOutputTransfers,
  generateSingleOutputProtoTransfers,
} from "./transfer";

export const enum StepType {
  CreateSplTokenAccounts,
  WormholeToSolana,
  SolanaOperations,
  WormholeFromSolana,
}

export interface BaseStep {
  readonly type: StepType;
  readonly isComplete: boolean;
}

export interface CreateSplTokenAccountsStep extends BaseStep {
  readonly type: StepType.CreateSplTokenAccounts;
  readonly mints: readonly string[];
  readonly txs: readonly SolanaTx[];
}

export interface WormholeToSolanaStep extends BaseStep {
  readonly type: StepType.WormholeToSolana;
  readonly knownAmounts: true;
  readonly transfers: Transfers<TransferToSolana>;
  readonly txs: TxsByTokenId;
}

export interface SolanaOperationsStep extends BaseStep {
  readonly type: StepType.SolanaOperations;
  readonly operations: readonly (OperationSpec & {
    readonly isComplete: boolean;
  })[];
  readonly txs: TxsByPoolId;
}

export interface WormholeFromSolanaFullStep extends BaseStep {
  readonly type: StepType.WormholeFromSolana;
  readonly knownAmounts: true;
  readonly transfers: Transfers<Transfer>;
  readonly txs: TxsByTokenId;
}

export interface WormholeFromSolanaProtoStep extends BaseStep {
  readonly type: StepType.WormholeFromSolana;
  readonly knownAmounts: false;
  readonly transfers: Transfers<ProtoTransfer>;
  readonly txs: TxsByTokenId;
}

export type WormholeFromSolanaStep =
  | WormholeFromSolanaFullStep
  | WormholeFromSolanaProtoStep;

export type Step =
  | CreateSplTokenAccountsStep
  | WormholeToSolanaStep
  | SolanaOperationsStep
  | WormholeFromSolanaStep;

export type Steps<F extends WormholeFromSolanaStep = WormholeFromSolanaStep> = {
  readonly createSplTokenAccounts: CreateSplTokenAccountsStep;
  readonly wormholeToSolana: WormholeToSolanaStep;
  readonly doPoolOperations: SolanaOperationsStep;
  readonly wormholeFromSolana: F;
};

export interface TxsByStep {
  readonly [StepType.CreateSplTokenAccounts]: readonly SolanaTx[];
  readonly [StepType.WormholeToSolana]: TxsByTokenId;
  readonly [StepType.SolanaOperations]: TxsByPoolId;
  readonly [StepType.WormholeFromSolana]: TxsByTokenId;
}

export const isWormholeFromSolanaFullStep = (
  wormholeFromSolanaStep: WormholeFromSolanaStep,
): wormholeFromSolanaStep is WormholeFromSolanaFullStep =>
  wormholeFromSolanaStep.knownAmounts;

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
            interactionSpec.params.inputAmounts.get(token.id) ?? null;
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
            interactionSpec.params.minimumOutputAmounts.get(token.id) ?? null;
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
            interactionSpec.params.exactOutputAmounts.get(token.id) ?? null;
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

export const findMissingSplTokenAccountMints = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
  splTokenAccounts: readonly TokenAccount[],
): readonly string[] => {
  const requiredTokens = getRequiredTokens(
    tokensByPoolId,
    poolSpecs,
    interaction,
  );
  return requiredTokens
    .map((token) => getSolanaTokenDetails(token).address)
    .filter((mintAddress) => {
      const walletAddress = interaction.connectedWallets[EcosystemId.Solana];
      if (walletAddress === null) {
        throw new Error("Missing Solana wallet");
      }
      const associatedTokenAccount = findTokenAccountForMint(
        mintAddress,
        walletAddress,
        splTokenAccounts,
      );
      return associatedTokenAccount === null;
    });
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
              (token) => exactOutputAmounts.get(token.id) ?? Amount.zero(token),
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

export const createAddSteps = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: AddInteraction,
  operations: readonly OperationSpec[],
  splTokenAccounts: readonly TokenAccount[],
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params, lpTokenTargetEcosystem } = interaction;
  const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    tokensByPoolId,
    poolSpecs,
    interaction,
    splTokenAccounts,
  );
  return {
    createSplTokenAccounts: {
      type: StepType.CreateSplTokenAccounts,
      isComplete: false,
      txs: txsByStep[StepType.CreateSplTokenAccounts],
      mints: missingTokenAccountMints,
    },
    wormholeToSolana: {
      type: StepType.WormholeToSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeToSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateInputTransfers(
          interactionId,
          splTokenAccounts,
          tokens,
          tokens.map(
            (token) => params.inputAmounts.get(token.id) ?? Amount.zero(token),
          ),
          interaction.signatureSetKeypairs,
        ),
      },
    },
    doPoolOperations: {
      type: StepType.SolanaOperations,
      isComplete: false,
      operations: operations.map((operation) => ({
        ...operation,
        isComplete: false,
      })),
      txs: txsByStep[StepType.SolanaOperations],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.LpToken,
        lpToken: generateLpOutProtoTransfer(
          interactionId,
          lpToken,
          lpTokenTargetEcosystem,
        ),
      },
    },
  };
};

export const createRemoveUniformSteps = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: RemoveUniformInteraction,
  operations: readonly OperationSpec[],
  splTokenAccounts: readonly TokenAccount[],
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params, lpTokenSourceEcosystem } = interaction;
  const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    tokensByPoolId,
    poolSpecs,
    interaction,
    splTokenAccounts,
  );
  return {
    createSplTokenAccounts: {
      type: StepType.CreateSplTokenAccounts,
      isComplete: false,
      txs: txsByStep[StepType.CreateSplTokenAccounts],
      mints: missingTokenAccountMints,
    },
    wormholeToSolana: {
      type: StepType.WormholeToSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeToSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.LpToken,
        lpToken: generateLpInTransfer(
          interactionId,
          lpToken,
          params.exactBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    doPoolOperations: {
      type: StepType.SolanaOperations,
      isComplete: false,
      operations: operations.map((operation) => ({
        ...operation,
        isComplete: false,
      })),
      txs: txsByStep[StepType.SolanaOperations],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateOutputProtoTransfers(
          interactionId,
          splTokenAccounts,
          tokens,
        ),
      },
    },
  };
};

export const createRemoveExactBurnSteps = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: RemoveExactBurnInteraction,
  operations: readonly OperationSpec[],
  splTokenAccounts: readonly TokenAccount[],
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params, lpTokenSourceEcosystem } = interaction;
  const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    tokensByPoolId,
    poolSpecs,
    interaction,
    splTokenAccounts,
  );
  const outputTokenIndex = tokens.findIndex(
    (token) => token.id === params.minimumOutputAmount.tokenId,
  );
  if (outputTokenIndex === -1) {
    throw new Error("Invalid output token");
  }

  return {
    createSplTokenAccounts: {
      type: StepType.CreateSplTokenAccounts,
      isComplete: false,
      txs: txsByStep[StepType.CreateSplTokenAccounts],
      mints: missingTokenAccountMints,
    },
    wormholeToSolana: {
      type: StepType.WormholeToSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeToSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.LpToken,
        lpToken: generateLpInTransfer(
          interactionId,
          lpToken,
          params.exactBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    doPoolOperations: {
      type: StepType.SolanaOperations,
      isComplete: false,
      operations: operations.map((operation) => ({
        ...operation,
        isComplete: false,
      })),
      txs: txsByStep[StepType.SolanaOperations],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateSingleOutputProtoTransfers(
          interactionId,
          tokens,
          outputTokenIndex,
        ),
      },
    },
  };
};

export const createRemoveExactOutputSteps = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: RemoveExactOutputInteraction,
  operations: readonly OperationSpec[],
  splTokenAccounts: readonly TokenAccount[],
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params, lpTokenSourceEcosystem } = interaction;
  const { tokens, lpToken } = tokensByPoolId[poolSpecs[0].id];
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    tokensByPoolId,
    poolSpecs,
    interaction,
    splTokenAccounts,
  );

  return {
    createSplTokenAccounts: {
      type: StepType.CreateSplTokenAccounts,
      isComplete: false,
      txs: txsByStep[StepType.CreateSplTokenAccounts],
      mints: missingTokenAccountMints,
    },
    wormholeToSolana: {
      type: StepType.WormholeToSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeToSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.LpToken,
        lpToken: generateLpInTransfer(
          interactionId,
          lpToken,
          params.maximumBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    doPoolOperations: {
      type: StepType.SolanaOperations,
      isComplete: false,
      operations: operations.map((operation) => ({
        ...operation,
        isComplete: false,
      })),
      txs: txsByStep[StepType.SolanaOperations],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateOutputTransfers(
          interactionId,
          splTokenAccounts,
          tokens,
          tokens.map(
            (token) =>
              params.exactOutputAmounts.get(token.id) ?? Amount.zero(token),
          ),
        ),
      },
    },
  };
};

export const createSwapSteps = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: SwapInteraction,
  operations: readonly OperationSpec[],
  splTokenAccounts: readonly TokenAccount[],
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params } = interaction;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    tokensByPoolId,
    poolSpecs,
    interaction,
    splTokenAccounts,
  );

  const inputPool = poolSpecs[0];
  const outputPool = poolSpecs[poolSpecs.length - 1];
  const inputPoolTokens = tokensByPoolId[inputPool.id];
  const outputPoolTokens = tokensByPoolId[outputPool.id];
  const outputTokenIndex = outputPoolTokens.tokens.findIndex(
    (token) => token.id === params.minimumOutputAmount.tokenId,
  );
  if (outputTokenIndex === -1) {
    throw new Error("Invalid output token");
  }

  return {
    createSplTokenAccounts: {
      type: StepType.CreateSplTokenAccounts,
      isComplete: false,
      txs: txsByStep[StepType.CreateSplTokenAccounts],
      mints: missingTokenAccountMints,
    },
    wormholeToSolana: {
      type: StepType.WormholeToSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeToSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateInputTransfers(
          interactionId,
          splTokenAccounts,
          inputPoolTokens.tokens,
          inputPoolTokens.tokens.map((token) =>
            token.id === params.exactInputAmount.tokenId
              ? params.exactInputAmount
              : Amount.zero(token),
          ),
          interaction.signatureSetKeypairs,
        ),
      },
    },
    doPoolOperations: {
      type: StepType.SolanaOperations,
      isComplete: false,
      operations: operations.map((operation) => ({
        ...operation,
        isComplete: false,
      })),
      txs: txsByStep[StepType.SolanaOperations],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateSingleOutputProtoTransfers(
          interactionId,
          outputPoolTokens.tokens,
          outputTokenIndex,
        ),
      },
    },
  };
};

export const getTransferToTxs = (
  chains: ChainsByProtocol,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  signatureSetAddresses: ReadonlyRecord<string, string | undefined>,
  txs: readonly Tx[],
): TxsByTokenId =>
  [lpToken, ...tokens].reduce((accumulator, token) => {
    const solanaMint = getSolanaTokenDetails(token).address;
    const signatureSetAddress = signatureSetAddresses[token.id] ?? null;
    const txsForToken = txs.filter((tx) =>
      isTransferToTx(
        chains,
        walletAddress,
        splTokenAccounts,
        token,
        solanaMint,
        signatureSetAddress,
        tx,
      ),
    );
    return {
      ...accumulator,
      // NOTE: txs arrive most recent first
      [token.id]: [...txsForToken].reverse(),
    };
  }, {});

export const findPoolOperationTxs = (
  poolSpecs: readonly PoolSpec[],
  txs: readonly Tx[],
): TxsByPoolId =>
  txs.reduce<TxsByPoolId>((txsByPoolId, tx) => {
    if (!isSolanaTx(tx)) {
      return txsByPoolId;
    }
    const poolSpec =
      poolSpecs.find(
        ({ address, contract }) =>
          isPoolTx(contract, tx) &&
          tx.parsedTx.transaction.message.accountKeys.some(
            (key) => key.pubkey.toBase58() === address,
          ),
      ) ?? null;
    return poolSpec === null
      ? txsByPoolId
      : {
          ...txsByPoolId,
          [poolSpec.id]: [...(txsByPoolId[poolSpec.id] ?? []), tx],
        };
  }, {});

export const getTransferFromTxs = (
  chainsConfig: ChainsByProtocol,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  txs: readonly Tx[],
): TxsByTokenId => {
  return [lpToken, ...tokens].reduce((accumulator, token) => {
    const txsForToken = txs.filter((tx) =>
      isTransferFromTx(
        chainsConfig,
        walletAddress,
        splTokenAccounts,
        token,
        tx,
      ),
    );
    return {
      ...accumulator,
      // NOTE: txs arrive most recent first
      [token.id]: [...txsForToken].reverse(),
    };
  }, {});
};

export const getRequiredPoolsForSwap = (
  poolSpecs: readonly PoolSpec[],
  inputTokenId: string,
  outputTokenId: string,
): readonly PoolSpec[] => {
  const singlePool =
    poolSpecs.find((poolSpec) =>
      [inputTokenId, outputTokenId].every((tokenId) =>
        poolSpec.tokenAccounts.has(tokenId),
      ),
    ) ?? null;
  if (singlePool !== null) {
    return [singlePool];
  }
  // NOTE: We assume a maximum of two pools
  // TODO: Handle swimUSD swaps
  const inputPool = findOrThrow(poolSpecs, (poolSpec) =>
    poolSpec.tokenAccounts.has(inputTokenId),
  );
  const outputPool = findOrThrow(poolSpecs, (poolSpec) =>
    poolSpec.tokenAccounts.has(outputTokenId),
  );
  return [inputPool, outputPool];
};

/** Returns one or two pools involved in the interaction */
export const getRequiredPools = (
  poolSpecs: readonly PoolSpec[],
  interactionSpec: InteractionSpec,
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
    case InteractionType.Swap: {
      return getRequiredPoolsForSwap(
        poolSpecs,
        interactionSpec.params.exactInputAmount.tokenId,
        interactionSpec.params.minimumOutputAmount.tokenId,
      );
    }
    default:
      throw new Error("Unknown interaction type");
  }
};

export const createSteps = (
  config: Config,
  interaction: Interaction,
  poolMaths: readonly PoolMath[],
  splTokenAccounts: readonly TokenAccount[],
  txs: readonly Tx[],
): Steps => {
  const walletAddress = interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const tokensByPool = getTokensByPool(config);
  const requiredPools = getRequiredPools(config.pools, interaction);
  const inputPool = requiredPools[0];
  const outputPool = requiredPools[requiredPools.length - 1];
  const inputPoolTokens = tokensByPool[inputPool.id];
  const outputPoolTokens = tokensByPool[outputPool.id];

  const createSplTokenAccountsTxs: readonly SolanaTx[] = [];
  const wormholeToSolanaTxs = getTransferToTxs(
    config.chains,
    walletAddress,
    splTokenAccounts,
    inputPoolTokens.tokens,
    inputPoolTokens.lpToken,
    interaction.previousSignatureSetAddresses,
    txs,
  );
  const poolOperationTxs = findPoolOperationTxs(requiredPools, txs);
  const wormholeFromSolanaTxs = getTransferFromTxs(
    config.chains,
    walletAddress,
    splTokenAccounts,
    outputPoolTokens.tokens,
    outputPoolTokens.lpToken,
    txs,
  );
  const txsByStep: TxsByStep = {
    [StepType.CreateSplTokenAccounts]: createSplTokenAccountsTxs,
    [StepType.WormholeToSolana]: wormholeToSolanaTxs,
    [StepType.SolanaOperations]: poolOperationTxs,
    [StepType.WormholeFromSolana]: wormholeFromSolanaTxs,
  };
  const operationSpecs = createOperationSpecs(
    tokensByPool,
    requiredPools,
    poolMaths,
    interaction,
  );

  switch (interaction.type) {
    case InteractionType.Add:
      return createAddSteps(
        tokensByPool,
        requiredPools,
        interaction,
        operationSpecs,
        splTokenAccounts,
        txsByStep,
      );
    case InteractionType.RemoveUniform:
      return createRemoveUniformSteps(
        tokensByPool,
        requiredPools,
        interaction,
        operationSpecs,
        splTokenAccounts,
        txsByStep,
      );
    case InteractionType.RemoveExactBurn:
      return createRemoveExactBurnSteps(
        tokensByPool,
        requiredPools,
        interaction,
        operationSpecs,
        splTokenAccounts,
        txsByStep,
      );
    case InteractionType.RemoveExactOutput:
      return createRemoveExactOutputSteps(
        tokensByPool,
        requiredPools,
        interaction,
        operationSpecs,
        splTokenAccounts,
        txsByStep,
      );
    case InteractionType.Swap:
      return createSwapSteps(
        tokensByPool,
        requiredPools,
        interaction,
        operationSpecs,
        splTokenAccounts,
        txsByStep,
      );
    default:
      throw new Error("Interaction type not supported");
  }
};
