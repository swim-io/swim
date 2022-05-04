import type { AccountInfo as TokenAccount } from "@solana/spl-token";

import { EcosystemId, getSolanaTokenDetails } from "../../config";
import type { ChainsByProtocol, TokenSpec } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { Amount } from "../amount";
import type { SolanaTx, Tx, TxsByTokenId } from "../crossEcosystem";
import { findTokenAccountForMint } from "../solana";
import { isTransferFromTx, isTransferToTx } from "../wormhole";

import type {
  AddInteraction,
  Interaction,
  InteractionSpec,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
} from "./interaction";
import { InteractionKind } from "./interaction";
import { isPoolTx } from "./pool";
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
  readonly txs: readonly Tx[];
}

export interface WormholeToSolanaStep extends BaseStep {
  readonly type: StepType.WormholeToSolana;
  readonly knownAmounts: true;
  readonly transfers: Transfers<TransferToSolana>;
  readonly txs: TxsByTokenId;
}

export interface SolanaOperationsStep extends BaseStep {
  readonly type: StepType.SolanaOperations;
  readonly txs: readonly Tx[];
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
  readonly interactWithPool: SolanaOperationsStep;
  readonly wormholeFromSolana: F;
};

export interface TxsByStep {
  readonly [StepType.CreateSplTokenAccounts]: readonly SolanaTx[];
  readonly [StepType.WormholeToSolana]: TxsByTokenId;
  readonly [StepType.SolanaOperations]: readonly SolanaTx[];
  readonly [StepType.WormholeFromSolana]: TxsByTokenId;
}

export const isWormholeFromSolanaFullStep = (
  wormholeFromSolanaStep: WormholeFromSolanaStep,
): wormholeFromSolanaStep is WormholeFromSolanaFullStep =>
  wormholeFromSolanaStep.knownAmounts;

export const getRequiredTokens = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interactionSpec: InteractionSpec,
): readonly TokenSpec[] => {
  switch (interactionSpec.kind) {
    case InteractionKind.Add:
      return [
        ...tokens.filter((token) => {
          const inputAmount =
            interactionSpec.params.inputAmounts.get(token.id) ?? null;
          return inputAmount !== null && !inputAmount.isZero();
        }),
        lpToken,
      ];
    case InteractionKind.RemoveUniform:
      return [
        ...tokens.filter((token) => {
          const outputAmount =
            interactionSpec.params.minimumOutputAmounts.get(token.id) ?? null;
          return outputAmount !== null && !outputAmount.isZero();
        }),
        lpToken,
      ];
    case InteractionKind.RemoveExactBurn:
      return [
        ...tokens.filter(
          (token) => interactionSpec.params.outputTokenId === token.id,
        ),
        lpToken,
      ];
    case InteractionKind.RemoveExactOutput:
      return [
        ...tokens.filter((token) => {
          const outputAmount =
            interactionSpec.params.exactOutputAmounts.get(token.id) ?? null;
          return outputAmount !== null && !outputAmount.isZero();
        }),
        lpToken,
      ];
    case InteractionKind.Swap:
      return tokens.filter((token) => {
        if (interactionSpec.params.outputTokenId === token.id) {
          return true;
        }
        const inputAmount =
          interactionSpec.params.exactInputAmounts.get(token.id) ?? null;
        return inputAmount !== null && !inputAmount.isZero();
      });
    default:
      throw new Error("Unsupported instruction");
  }
};

export const findMissingSplTokenAccountMints = (
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: Interaction,
): readonly string[] => {
  const requiredTokens = getRequiredTokens(tokens, lpToken, interaction.spec);
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

export const createAddSteps = (
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: AddInteraction,
  txsByStep: TxsByStep,
): Steps => {
  const {
    id: interactionId,
    params,
    lpTokenTargetEcosystem,
  } = interaction.spec;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    splTokenAccounts,
    tokens,
    lpToken,
    interaction,
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
    interactWithPool: {
      type: StepType.SolanaOperations,
      isComplete: false,
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

export const createSwapSteps = (
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: SwapInteraction,
  txsByStep: TxsByStep,
): Steps => {
  const { id: interactionId, params } = interaction.spec;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    splTokenAccounts,
    tokens,
    lpToken,
    interaction,
  );
  const outputTokenIndex = tokens.findIndex(
    (token) => token.id === params.outputTokenId,
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
          tokens,
          tokens.map(
            (token) =>
              params.exactInputAmounts.get(token.id) ?? Amount.zero(token),
          ),
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaOperations,
      isComplete: false,
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

export const createRemoveUniformSteps = (
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: RemoveUniformInteraction,
  txsByStep: TxsByStep,
): Steps => {
  const {
    id: interactionId,
    params,
    lpTokenSourceEcosystem,
  } = interaction.spec;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    splTokenAccounts,
    tokens,
    lpToken,
    interaction,
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
    interactWithPool: {
      type: StepType.SolanaOperations,
      isComplete: false,
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
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: RemoveExactBurnInteraction,
  txsByStep: TxsByStep,
): Steps => {
  const {
    id: interactionId,
    params,
    lpTokenSourceEcosystem,
  } = interaction.spec;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    splTokenAccounts,
    tokens,
    lpToken,
    interaction,
  );
  const outputTokenIndex = tokens.findIndex(
    (token) => token.id === params.outputTokenId,
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
    interactWithPool: {
      type: StepType.SolanaOperations,
      isComplete: false,
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
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: RemoveExactOutputInteraction,
  txsByStep: TxsByStep,
): Steps => {
  const {
    id: interactionId,
    params,
    lpTokenSourceEcosystem,
  } = interaction.spec;
  const missingTokenAccountMints = findMissingSplTokenAccountMints(
    splTokenAccounts,
    tokens,
    lpToken,
    interaction,
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
    interactWithPool: {
      type: StepType.SolanaOperations,
      isComplete: false,
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

export const getTransferToTxs = (
  chainsConfig: ChainsByProtocol,
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
        chainsConfig,
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

export const findPoolInteractionTx = (
  poolContractAddress: string,
  txs: readonly Tx[],
): SolanaTx | null =>
  txs.find<SolanaTx>((tx): tx is SolanaTx =>
    isPoolTx(poolContractAddress, tx),
  ) ?? null;

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

export const createSteps = (
  chainsConfig: ChainsByProtocol,
  poolContractAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: Interaction,
  txs: readonly Tx[],
): Steps => {
  const createSplTokenAccountsTxs: readonly SolanaTx[] = [];
  const walletAddress = interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const wormholeToSolanaTxs = getTransferToTxs(
    chainsConfig,
    walletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    interaction.previousSignatureSetAddresses,
    txs,
  );
  const solanaPoolInteractionTx = findPoolInteractionTx(
    poolContractAddress,
    txs,
  );
  const wormholeFromSolanaTxs = getTransferFromTxs(
    chainsConfig,
    walletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    txs,
  );
  const txsByStep: TxsByStep = {
    [StepType.CreateSplTokenAccounts]: createSplTokenAccountsTxs,
    [StepType.WormholeToSolana]: wormholeToSolanaTxs,
    [StepType.SolanaOperations]: solanaPoolInteractionTx
      ? [solanaPoolInteractionTx]
      : [],
    [StepType.WormholeFromSolana]: wormholeFromSolanaTxs,
  };
  switch (interaction.kind) {
    case InteractionKind.Add:
      return createAddSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case InteractionKind.Swap:
      return createSwapSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case InteractionKind.RemoveUniform:
      return createRemoveUniformSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case InteractionKind.RemoveExactBurn:
      return createRemoveExactBurnSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case InteractionKind.RemoveExactOutput:
      return createRemoveExactOutputSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    default:
      throw new Error("Interaction type not supported");
  }
};
