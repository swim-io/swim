import type Decimal from "decimal.js";

import type { EcosystemId } from "../../config";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import type {
  AddInteraction,
  BaseInteraction,
  BaseInteractionSpec,
  InteractionType,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
} from "./interaction";
import type {
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
} from "./interactionState";

interface TokenTransferDetail {
  readonly tokenId: string;
  readonly ecosystemId: EcosystemId;
  readonly value: Decimal;
}

export interface SwapInteractionSpecV2 extends BaseInteractionSpec {
  readonly type: InteractionType.SwapV2;
  readonly params: {
    readonly fromTokenDetail: TokenTransferDetail;
    readonly toTokenDetail: TokenTransferDetail;
  };
}

export interface SwapInteractionV2
  extends BaseInteraction,
    SwapInteractionSpecV2 {}

export enum SwapType {
  SingleChainSolana = "SingleChainSolana",
  SingleChainEvm = "SingleChainEvm",
  CrossChainEvm = "CrossChainEvm",
  CrossChainSolanaToEvm = "CrossChainSolanaToEvm",
  CrossChainEvmToSolana = "CrossChainEvmToSolana",
}

export interface SingleChainSolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.SingleChainSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
}

export interface SingleChainEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.SingleChainEvm;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly onChainSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.CrossChainEvm;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainSolanaToEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.CrossChainSolanaToEvm;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly swapAndTransferTxId: SolanaTx["txId"] | null; // TODO: Confirm it can be done in 1 tx
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface CrossChainEvmToSolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.CrossChainEvmToSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly postVaaOnSolana: readonly SolanaTx["txId"][];
  readonly claimTokenOnSolana: SolanaTx["txId"] | null;
}

export interface AddInteractionState {
  readonly interaction: AddInteraction;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly addTxId: string | null;
}

export interface RemoveInteractionState {
  readonly interaction:
    | RemoveUniformInteraction
    | RemoveExactBurnInteraction
    | RemoveExactOutputInteraction;
  readonly approvalTxIds: readonly EvmTx["txId"][];
  readonly removeTxId: string | null;
}

export type InteractionV2 =
  | AddInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction
  | SwapInteractionV2;

export type InteractionStateV2 =
  | SingleChainSolanaSwapInteractionState
  | SingleChainEvmSwapInteractionState
  | CrossChainEvmSwapInteractionState
  | CrossChainEvmToSolanaSwapInteractionState
  | CrossChainSolanaToEvmSwapInteractionState
  | AddInteractionState
  | RemoveInteractionState;
