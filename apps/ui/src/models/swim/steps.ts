import type { AccountInfo as TokenAccount } from "@solana/spl-token";

import { EcosystemId, getSolanaTokenDetails } from "../../config";
import type { ChainsByProtocol, TokenSpec } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import type { SolanaTx, Tx, TxsByTokenId } from "../crossEcosystem";
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
  SolanaPoolInteraction,
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

export interface SolanaPoolInteractionStep extends BaseStep {
  readonly type: StepType.SolanaPoolInteraction;
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
  | SolanaPoolInteractionStep
  | WormholeFromSolanaStep;

export type Steps<F extends WormholeFromSolanaStep = WormholeFromSolanaStep> = {
  readonly createSplTokenAccounts: CreateSplTokenAccountsStep;
  readonly wormholeToSolana: WormholeToSolanaStep;
  readonly interactWithPool: SolanaPoolInteractionStep;
  readonly wormholeFromSolana: F;
};

export interface TxsByStep {
  readonly [StepType.CreateSplTokenAccounts]: readonly SolanaTx[];
  readonly [StepType.WormholeToSolana]: TxsByTokenId;
  readonly [StepType.SolanaPoolInteraction]: readonly SolanaTx[];
  readonly [StepType.WormholeFromSolana]: TxsByTokenId;
}

export const isWormholeFromSolanaFullStep = (
  wormholeFromSolanaStep: WormholeFromSolanaStep,
): wormholeFromSolanaStep is WormholeFromSolanaFullStep =>
  wormholeFromSolanaStep.knownAmounts;

export const getRequiredTokens = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: InteractionSpec,
): readonly TokenSpec[] => {
  switch (interaction.instruction) {
    case SwimDefiInstruction.Add:
      return [
        ...tokens.filter(
          (_, i) => !interaction.params.inputAmounts[i]?.isZero(),
        ),
        lpToken,
      ];
    case SwimDefiInstruction.RemoveUniform:
      return [
        ...tokens.filter(
          (_, i) => !interaction.params.minimumOutputAmounts[i]?.isZero(),
        ),
        lpToken,
      ];
    case SwimDefiInstruction.RemoveExactBurn:
      return [
        ...tokens.filter((_, i) => i === interaction.params.outputTokenIndex),
        lpToken,
      ];
    case SwimDefiInstruction.RemoveExactOutput:
      return [
        ...tokens.filter(
          (_, i) => !interaction.params.exactOutputAmounts[i]?.isZero(),
        ),
        lpToken,
      ];
    case SwimDefiInstruction.Swap:
      return tokens.filter(
        (_, i) =>
          !interaction.params.exactInputAmounts[i]?.isZero() ||
          i === interaction.params.outputTokenIndex,
      );
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
  const requiredTokens = getRequiredTokens(tokens, lpToken, interaction);
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
  const { params, lpTokenTargetEcosystem } = interaction;
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
          interaction.id,
          splTokenAccounts,
          tokens,
          params.inputAmounts,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaPoolInteraction,
      isComplete: false,
      txs: txsByStep[StepType.SolanaPoolInteraction],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.LpToken,
        lpToken: generateLpOutProtoTransfer(
          interaction.id,
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
  const { params } = interaction;
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
          interaction.id,
          splTokenAccounts,
          tokens,
          params.exactInputAmounts,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaPoolInteraction,
      isComplete: false,
      txs: txsByStep[StepType.SolanaPoolInteraction],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateSingleOutputProtoTransfers(
          interaction.id,
          tokens,
          params.outputTokenIndex,
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
  const { params, lpTokenSourceEcosystem } = interaction;
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
          interaction.id,
          lpToken,
          params.exactBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaPoolInteraction,
      isComplete: false,
      txs: txsByStep[StepType.SolanaPoolInteraction],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateOutputProtoTransfers(
          interaction.id,
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
  const { params, lpTokenSourceEcosystem } = interaction;
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
          interaction.id,
          lpToken,
          params.exactBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaPoolInteraction,
      isComplete: false,
      txs: txsByStep[StepType.SolanaPoolInteraction],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: false,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateSingleOutputProtoTransfers(
          interaction.id,
          tokens,
          params.outputTokenIndex,
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
  const { params, lpTokenSourceEcosystem } = interaction;
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
          interaction.id,
          lpToken,
          params.maximumBurnAmount,
          lpTokenSourceEcosystem,
          interaction.signatureSetKeypairs,
        ),
      },
    },
    interactWithPool: {
      type: StepType.SolanaPoolInteraction,
      isComplete: false,
      txs: txsByStep[StepType.SolanaPoolInteraction],
    },
    wormholeFromSolana: {
      type: StepType.WormholeFromSolana,
      isComplete: false,
      txs: txsByStep[StepType.WormholeFromSolana],
      knownAmounts: true,
      transfers: {
        type: TransferType.Tokens,
        tokens: generateOutputTransfers(
          interaction.id,
          splTokenAccounts,
          tokens,
          params.exactOutputAmounts,
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
    [StepType.SolanaPoolInteraction]: solanaPoolInteractionTx
      ? [solanaPoolInteractionTx]
      : [],
    [StepType.WormholeFromSolana]: wormholeFromSolanaTxs,
  };
  switch (interaction.instruction) {
    case SwimDefiInstruction.Add:
      return createAddSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case SwimDefiInstruction.Swap:
      return createSwapSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case SwimDefiInstruction.RemoveUniform:
      return createRemoveUniformSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case SwimDefiInstruction.RemoveExactBurn:
      return createRemoveExactBurnSteps(
        splTokenAccounts,
        tokens,
        lpToken,
        interaction,
        txsByStep,
      );
    case SwimDefiInstruction.RemoveExactOutput:
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
