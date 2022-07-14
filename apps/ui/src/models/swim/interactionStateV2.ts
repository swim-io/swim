import { isNotNull } from "../../utils";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import type {
  AddInteraction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteractionV2,
} from "./interaction";
import { InteractionType } from "./interaction";
import type {
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
} from "./interactionState";

export enum SwapType {
  SingleChainSolana = "SingleChainSolana",
  SingleChainEvm = "SingleChainEvm",
  CrossChainEvmToEvm = "CrossChainEvmToEvm",
  CrossChainSolanaToEvm = "CrossChainSolanaToEvm",
  CrossChainEvmToSolana = "CrossChainEvmToSolana",
}

export interface SingleChainSolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.SingleChainSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
}

export interface SingleChainEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.SingleChainEvm;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly onChainSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainEvmToEvm;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainSolanaToEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainSolanaToEvm;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly swapAndTransferTxId: SolanaTx["txId"] | null; // TODO: Confirm it can be done in 1 tx
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainEvmToSolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainEvmToSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly postVaaOnSolanaTxIds: readonly SolanaTx["txId"][];
  readonly claimTokenOnSolanaTxId: SolanaTx["txId"] | null;
}

export interface AddInteractionState {
  readonly interaction: AddInteraction;
  readonly interactionType: InteractionType.Add;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly addTxId: string | null;
}

export interface RemoveInteractionState {
  readonly interaction:
    | RemoveUniformInteraction
    | RemoveExactBurnInteraction
    | RemoveExactOutputInteraction;
  readonly interactionType:
    | InteractionType.RemoveExactBurn
    | InteractionType.RemoveExactOutput
    | InteractionType.RemoveUniform;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly removeTxId: string | null;
}

export type InteractionStateV2 =
  | SingleChainSolanaSwapInteractionState
  | SingleChainEvmSwapInteractionState
  | CrossChainEvmSwapInteractionState
  | CrossChainEvmToSolanaSwapInteractionState
  | CrossChainSolanaToEvmSwapInteractionState
  | AddInteractionState
  | RemoveInteractionState;

export const isRequiredSplTokenAccountsCompletedV2 = (
  accountState: RequiredSplTokenAccounts,
) =>
  Object.values(accountState).every(
    (state) => state.isExistingAccount || isNotNull(state.txId),
  );

export const isSolanaPoolOperationsCompletedV2 = (
  operations: readonly SolanaPoolOperationState[],
) => operations.every((operation) => isNotNull(operation.txId));

const isSingleChainSolanaSwapCompleted = (
  state: SingleChainSolanaSwapInteractionState,
): boolean => {
  return isSolanaPoolOperationsCompletedV2(state.solanaPoolOperations);
};

const isSingleChainEvmSwapCompleted = (
  state: SingleChainEvmSwapInteractionState,
): boolean => {
  return state.onChainSwapTxId !== null;
};

const isCrossChainEvmToEvmSwapCompleted = (
  state: CrossChainEvmSwapInteractionState,
): boolean => {
  return state.receiveAndSwapTxId !== null;
};

const isCrossChainEvmToSolanaSwapCompleted = (
  state: CrossChainEvmToSolanaSwapInteractionState,
): boolean => {
  return state.claimTokenOnSolanaTxId !== null;
};

const isCrossChainSolanaToEvmSwapCompleted = (
  state: CrossChainSolanaToEvmSwapInteractionState,
): boolean => {
  return state.receiveAndSwapTxId !== null;
};

export const isInteractWithPoolAndInitiateTransferOnSourceChainCompleted = (
  state: InteractionStateV2,
): boolean => {
  switch (state.interactionType) {
    case InteractionType.SwapV2: {
      switch (state.swapType) {
        case SwapType.SingleChainSolana: {
          return isSingleChainSolanaSwapCompleted(state);
        }
        case SwapType.SingleChainEvm: {
          return isSingleChainEvmSwapCompleted(state);
        }
        case SwapType.CrossChainEvmToEvm: {
          return isSwapAndTransferCompleted(state.swapAndTransferTxId);
        }
        case SwapType.CrossChainEvmToSolana: {
          return isSwapAndTransferCompleted(state.swapAndTransferTxId);
        }
        case SwapType.CrossChainSolanaToEvm: {
          return isSwapAndTransferCompleted(state.swapAndTransferTxId);
        }
        default: {
          throw new Error("Found new unhandled swapType");
        }
      }
    }
    case InteractionType.Add:
      return false;
    case InteractionType.RemoveUniform:
      return false;
    case InteractionType.RemoveExactBurn:
      return false;
    case InteractionType.RemoveExactOutput:
      return false;
  }
};

export const isCompleteTransferAndInteractWithPoolOnTargetChainCompleted = (
  state: InteractionStateV2,
): boolean => {
  switch (state.interactionType) {
    case InteractionType.SwapV2: {
      switch (state.swapType) {
        case SwapType.SingleChainSolana: {
          return true; // no such step
        }
        case SwapType.SingleChainEvm: {
          return true; // no such step
        }
        case SwapType.CrossChainEvmToEvm: {
          return isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId);
        }
        case SwapType.CrossChainEvmToSolana: {
          return isClaimTokenOnSolanaTransferCompleted(
            state.claimTokenOnSolanaTxId,
          );
        }
        case SwapType.CrossChainSolanaToEvm: {
          return isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId);
        }
        default: {
          throw new Error("Found new unhandled swapType");
        }
      }
    }
    case InteractionType.Add:
      return false;
    case InteractionType.RemoveUniform:
      return false;
    case InteractionType.RemoveExactBurn:
      return false;
    case InteractionType.RemoveExactOutput:
      return false;
  }
};

export const isInteractionCompletedV2 = (
  interactionState: InteractionStateV2,
): boolean => {
  switch (interactionState.interactionType) {
    case InteractionType.SwapV2: {
      switch (interactionState.swapType) {
        case SwapType.SingleChainSolana: {
          return isSingleChainSolanaSwapCompleted(interactionState);
        }
        case SwapType.SingleChainEvm: {
          return isSingleChainEvmSwapCompleted(interactionState);
        }
        case SwapType.CrossChainEvmToEvm: {
          return isCrossChainEvmToEvmSwapCompleted(interactionState);
        }
        case SwapType.CrossChainEvmToSolana: {
          return isCrossChainEvmToSolanaSwapCompleted(interactionState);
        }
        case SwapType.CrossChainSolanaToEvm: {
          return isCrossChainSolanaToEvmSwapCompleted(interactionState);
        }
        default: {
          throw new Error("Found new unhandled swapType");
        }
      }
    }
    case InteractionType.Add:
      return false;
    case InteractionType.RemoveUniform:
      return false;
    case InteractionType.RemoveExactBurn:
      return false;
    case InteractionType.RemoveExactOutput:
      return false;
  }
};
