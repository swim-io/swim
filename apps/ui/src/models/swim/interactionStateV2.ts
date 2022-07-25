import { EcosystemId, isEvmEcosystemId } from "../../config";
import { isNotNull } from "../../utils";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import type {
  AddInteraction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteractionV2,
  TokenOption,
} from "./interaction";
import { InteractionType } from "./interaction";
import type { RequiredSplTokenAccounts } from "./interactionState";

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
  readonly onChainSwapTxId: SolanaTx["txId"] | null;
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
  /** Needed only for solana based pools */
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts | null;
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
  /** Needed only for solana based pools */
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts | null;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly removeTxId: string | null;
}

export type SwapInteractionState =
  | SingleChainSolanaSwapInteractionState
  | SingleChainEvmSwapInteractionState
  | CrossChainEvmSwapInteractionState
  | CrossChainEvmToSolanaSwapInteractionState
  | CrossChainSolanaToEvmSwapInteractionState;

export type InteractionStateV2 =
  | SwapInteractionState
  | AddInteractionState
  | RemoveInteractionState;

export const getSwapType = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
): SwapType => {
  const fromEcosystem = fromTokenOption.ecosystemId;
  const toEcosystem = toTokenOption.ecosystemId;
  if (
    fromEcosystem === EcosystemId.Solana &&
    toEcosystem === EcosystemId.Solana
  ) {
    return SwapType.SingleChainSolana;
  }
  if (isEvmEcosystemId(fromEcosystem) && isEvmEcosystemId(toEcosystem)) {
    return fromEcosystem === toEcosystem
      ? SwapType.SingleChainEvm
      : SwapType.CrossChainEvmToEvm;
  }
  if (fromEcosystem === EcosystemId.Solana && isEvmEcosystemId(toEcosystem)) {
    return SwapType.CrossChainSolanaToEvm;
  }
  if (isEvmEcosystemId(fromEcosystem) && toEcosystem === EcosystemId.Solana) {
    return SwapType.CrossChainEvmToSolana;
  }

  throw new Error("Unknown swap type");
};

export const isRequiredSplTokenAccountsCompletedV2 = (
  accountState: RequiredSplTokenAccounts,
) =>
  Object.values(accountState).every(
    (state) => state.isExistingAccount || isNotNull(state.txId),
  );

const isSingleChainSolanaSwapCompleted = (
  state: SingleChainSolanaSwapInteractionState,
): boolean => {
  return state.onChainSwapTxId !== null;
};

const isSingleChainEvmSwapCompleted = (
  state: SingleChainEvmSwapInteractionState,
): boolean => {
  return state.onChainSwapTxId !== null;
};

const isCrossChainEvmToEvmSwapCompleted = (
  state: CrossChainEvmSwapInteractionState,
): boolean => {
  return isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId);
};

const isCrossChainEvmToSolanaSwapCompleted = (
  state: CrossChainEvmToSolanaSwapInteractionState,
): boolean => {
  return isClaimTokenOnSolanaTransferCompleted(state.claimTokenOnSolanaTxId);
};

const isCrossChainSolanaToEvmSwapCompleted = (
  state: CrossChainSolanaToEvmSwapInteractionState,
): boolean => {
  return isReceiveAndSwapTransferCompleted(state.receiveAndSwapTxId);
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

export const isRemoveInteractionCompleted = (
  interactionState: RemoveInteractionState,
) => interactionState.removeTxId !== null;

export const isAddInteractionCompleted = (
  interactionState: AddInteractionState,
) => interactionState.addTxId !== null;

export const isSourceChainOperationCompleted = (
  state: SwapInteractionState,
): boolean => {
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
};

export const isTargetChainOperationCompleted = (
  state: SwapInteractionState,
): boolean => {
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
      return isAddInteractionCompleted(interactionState);
    case InteractionType.RemoveUniform:
      return isRemoveInteractionCompleted(interactionState);
    case InteractionType.RemoveExactBurn:
      return isRemoveInteractionCompleted(interactionState);
    case InteractionType.RemoveExactOutput:
      return isRemoveInteractionCompleted(interactionState);
  }
};
