import type { EvmTx } from "@swim-io/evm";
import { isEvmEcosystemId } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isNotNull } from "@swim-io/utils";

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
  readonly version: 2;
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.SingleChainSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly onChainSwapTxId: SolanaTx["id"] | null;
}

export interface SingleChainEvmSwapInteractionState {
  readonly version: 2;
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.SingleChainEvm;
  readonly approvalTxIds: readonly EvmTx["id"][];
  readonly onChainSwapTxId: EvmTx["id"] | null;
}

export interface CrossChainEvmToEvmSwapInteractionState {
  readonly version: 2;
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainEvmToEvm;
  readonly approvalTxIds: readonly EvmTx["id"][];
  readonly crossChainInitiateTxId: EvmTx["id"] | null;
  readonly crossChainCompleteTxId: EvmTx["id"] | null;
}

export interface CrossChainSolanaToEvmSwapInteractionState {
  readonly version: 2;
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainSolanaToEvm;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly swapToSwimUsdTxId: SolanaTx["id"] | null;
  readonly transferSwimUsdToEvmTxId: SolanaTx["id"] | null;
  readonly crossChainCompleteTxId: EvmTx["id"] | null;
}

export interface CrossChainEvmToSolanaSwapInteractionState {
  readonly version: 2;
  readonly interaction: SwapInteractionV2;
  readonly interactionType: InteractionType.SwapV2;
  readonly swapType: SwapType.CrossChainEvmToSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly approvalTxIds: readonly EvmTx["id"][];
  readonly crossChainInitiateTxId: EvmTx["id"] | null;
  readonly auxiliarySignerPublicKey: string | null;
  readonly verifySignaturesTxIds: readonly SolanaTx["id"][];
  readonly postVaaOnSolanaTxId: SolanaTx["id"] | null;
  readonly completeNativeWithPayloadTxId: SolanaTx["id"] | null;
  readonly processSwimPayloadTxId: SolanaTx["id"] | null;
}

export interface AddInteractionState {
  readonly version: 2;
  readonly interaction: AddInteraction;
  readonly interactionType: InteractionType.Add;
  /** Needed only for solana based pools */
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts | null;
  readonly approvalTxIds: readonly EvmTx["id"][];
  readonly addTxId: string | null;
}

export interface RemoveInteractionState {
  readonly version: 2;
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
  readonly approvalTxIds: readonly EvmTx["id"][];
  readonly removeTxId: string | null;
}

export type SwapInteractionState =
  | SingleChainSolanaSwapInteractionState
  | SingleChainEvmSwapInteractionState
  | CrossChainEvmToEvmSwapInteractionState
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
    fromEcosystem === SOLANA_ECOSYSTEM_ID &&
    toEcosystem === SOLANA_ECOSYSTEM_ID
  ) {
    return SwapType.SingleChainSolana;
  }
  if (isEvmEcosystemId(fromEcosystem) && isEvmEcosystemId(toEcosystem)) {
    return fromEcosystem === toEcosystem
      ? SwapType.SingleChainEvm
      : SwapType.CrossChainEvmToEvm;
  }
  if (fromEcosystem === SOLANA_ECOSYSTEM_ID && isEvmEcosystemId(toEcosystem)) {
    return SwapType.CrossChainSolanaToEvm;
  }
  if (isEvmEcosystemId(fromEcosystem) && toEcosystem === SOLANA_ECOSYSTEM_ID) {
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

export const isSourceChainOperationCompleted = (
  state: SwapInteractionState,
): boolean => {
  switch (state.swapType) {
    case SwapType.SingleChainSolana:
    case SwapType.SingleChainEvm:
      return state.onChainSwapTxId !== null;
    case SwapType.CrossChainEvmToEvm:
    case SwapType.CrossChainEvmToSolana:
      return state.crossChainInitiateTxId !== null;
    case SwapType.CrossChainSolanaToEvm:
      return state.transferSwimUsdToEvmTxId !== null;
  }
};

export const isTargetChainOperationCompleted = (
  state: SwapInteractionState,
): boolean => {
  switch (state.swapType) {
    case SwapType.SingleChainSolana:
    case SwapType.SingleChainEvm:
      return state.onChainSwapTxId !== null;
    case SwapType.CrossChainEvmToEvm:
    case SwapType.CrossChainSolanaToEvm:
      return state.crossChainCompleteTxId !== null;
    case SwapType.CrossChainEvmToSolana: {
      return state.processSwimPayloadTxId !== null;
    }
  }
};

export const isInteractionCompletedV2 = (
  interactionState: InteractionStateV2,
): boolean => {
  switch (interactionState.interactionType) {
    case InteractionType.SwapV2:
      return isTargetChainOperationCompleted(interactionState);
    case InteractionType.Add:
      return interactionState.addTxId !== null;
    case InteractionType.RemoveUniform:
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput:
      return interactionState.removeTxId !== null;
  }
};
