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
  Solana = "Solana",
  Evm = "Evm",
  EvmCrossChain = "EvmCrossChain",
  SolanaToEvm = "SolanaToEvm",
  EvmToSolana = "EvmToSolana",
}

export interface SolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.Solana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
}

export interface EvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.Evm;
  readonly onChainSwapTxId: EvmTx["txId"] | null;
}

export interface EvmCrossChainSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.EvmCrossChain;
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface SolanaToEvmSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.SolanaToEvm;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly swapAndTransferTxId: SolanaTx["txId"] | null; // TODO: Confirm it can be done in 1 tx
  readonly receiveAndSwapTxId: EvmTx["txId"] | null;
}

export interface EvmToSolanaSwapInteractionState {
  readonly interaction: SwapInteractionV2;
  readonly swapType: SwapType.EvmToSolana;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly swapAndTransferTxId: EvmTx["txId"] | null;
  readonly postVaaOnSolana: readonly SolanaTx["txId"][];
  readonly claimTokenOnSolana: SolanaTx["txId"] | null;
}

export interface AddInteractionState {
  readonly interaction: AddInteraction;
  readonly addTxId: string | null;
}

export interface RemoveInteractionState {
  readonly interaction:
    | RemoveUniformInteraction
    | RemoveExactBurnInteraction
    | RemoveExactOutputInteraction;
  readonly removeTxId: string | null;
}

export type InteractionV2 =
  | AddInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction
  | SwapInteractionV2;

export type InteractionStateV2 =
  | SolanaSwapInteractionState
  | EvmSwapInteractionState
  | EvmCrossChainSwapInteractionState
  | SolanaToEvmSwapInteractionState
  | EvmToSolanaSwapInteractionState
  | AddInteractionState
  | RemoveInteractionState;
