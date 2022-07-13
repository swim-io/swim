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

export type SwapInteractionStateV2 =
  | SingleChainSolanaSwapInteractionState
  | SingleChainEvmSwapInteractionState
  | CrossChainEvmSwapInteractionState
  | CrossChainEvmToSolanaSwapInteractionState
  | CrossChainSolanaToEvmSwapInteractionState;

export type InteractionStateV2 =
  | SwapInteractionStateV2
  | AddInteractionState
  | RemoveInteractionState;

export const isSwapInteractionStateV2 = (
  interactionState: InteractionStateV2,
): interactionState is SwapInteractionStateV2 => {
  return interactionState.interaction.type === InteractionType.SwapV2;
};

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
  state: Pick<
    SingleChainSolanaSwapInteractionState,
    "requiredSplTokenAccounts" | "solanaPoolOperations"
  >,
): boolean => {
  return (
    isRequiredSplTokenAccountsCompletedV2(state.requiredSplTokenAccounts) &&
    isSolanaPoolOperationsCompletedV2(state.solanaPoolOperations)
  );
};

const isSingleChainEvmSwapCompleted = (
  state: Pick<
    SingleChainEvmSwapInteractionState,
    "approvalTxIds" | "onChainSwapTxId"
  >,
): boolean => {
  return (
    isApprovalCompleted(state.approvalTxIds) && state.onChainSwapTxId !== null
  );
};

const isCrossChainEvmToEvmSwapCompleted = (
  state: Pick<
    CrossChainEvmSwapInteractionState,
    "approvalTxIds" | "swapAndTransferTxId" | "receiveAndSwapTxId"
  >,
): boolean => {
  return (
    isApprovalCompleted(state.approvalTxIds) &&
    isSwapAndTransferCompleted(state.swapAndTransferTxId) &&
    isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId)
  );
};

const isCrossChainEvmToSolanaSwapCompleted = (
  state: Pick<
    CrossChainEvmToSolanaSwapInteractionState,
    | "approvalTxIds"
    | "postVaaOnSolanaTxIds"
    | "requiredSplTokenAccounts"
    | "swapAndTransferTxId"
    | "claimTokenOnSolanaTxId"
  >,
): boolean => {
  return (
    isRequiredSplTokenAccountsCompletedV2(state.requiredSplTokenAccounts) &&
    isApprovalCompleted(state.approvalTxIds) &&
    isSwapAndTransferCompleted(state.swapAndTransferTxId) &&
    state.postVaaOnSolanaTxIds.length > 0 && // TODO does it need a specific length?
    isClaimTokenOnSolanaTransferCompleted(state.claimTokenOnSolanaTxId)
  );
};

const isCrossChainSolanaToEvmSwapCompleted = (
  state: Pick<
    CrossChainSolanaToEvmSwapInteractionState,
    "requiredSplTokenAccounts" | "swapAndTransferTxId" | "receiveAndSwapTxId"
  >,
): boolean => {
  return (
    isRequiredSplTokenAccountsCompletedV2(state.requiredSplTokenAccounts) &&
    isSwapAndTransferCompleted(state.swapAndTransferTxId) &&
    isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId)
  );
};

export const isApprovalCompleted = (
  approvalTxIds: readonly EvmTx["txId"][],
) => {
  return approvalTxIds.length > 0; // TODO does it need a specific length?
};

const isSwapAndTransferCompleted = (
  swapAndTransferTxId: EvmTx["txId"] | null,
): boolean => swapAndTransferTxId !== null;

const isReceiveAndSwapTransferCompleted = (
  receiveAndSwapTxId: EvmTx["txId"] | null,
): boolean => receiveAndSwapTxId !== null;

const isClaimTokenOnSolanaTransferCompleted = (
  claimTokenOnSolanaTxId: SolanaTx["txId"] | null,
): boolean => claimTokenOnSolanaTxId !== null;

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
          return (
            isApprovalCompleted(state.approvalTxIds) &&
            isSwapAndTransferCompleted(state.swapAndTransferTxId)
          );
        }
        case SwapType.CrossChainEvmToSolana: {
          return (
            isApprovalCompleted(state.approvalTxIds) &&
            isSwapAndTransferCompleted(state.swapAndTransferTxId)
          );
        }
        case SwapType.CrossChainSolanaToEvm: {
          return isSwapAndTransferCompleted(state.swapAndTransferTxId);
        }
      }
      // looks like eslint is buggy with nested switch statements and needs this unreachable break?
      break;
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
      }
      // looks like eslint is buggy with nested switch statements and needs this unreachable break?
      break;
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
      }
      // looks like eslint is buggy with nested switch statements and needs this unreachable break?
      break;
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
