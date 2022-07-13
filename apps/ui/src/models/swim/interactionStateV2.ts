import type { EvmTx, SolanaTx } from "../crossEcosystem";

import type {
  AddInteraction,
  InteractionType,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteractionV2,
} from "./interaction";
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
