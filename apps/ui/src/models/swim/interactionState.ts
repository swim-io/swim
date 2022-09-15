import type { EvmTx } from "@swim-io/evm";
import type { SolanaTx } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { isNotNull } from "@swim-io/utils";
import type Decimal from "decimal.js";

import type { TokenConfig } from "../../config";

import type { Interaction } from "./interaction";
import type { OperationSpec } from "./operation";

export interface InteractionState {
  readonly version: undefined;
  readonly interaction: Interaction;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly toSolanaTransfers: readonly ToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly fromSolanaTransfers: readonly FromSolanaTransferState[];
}

export interface TokenAccountState {
  readonly isExistingAccount: boolean;
  readonly txId: SolanaTx["id"] | null;
}

/**
 * Record with token mint address as key, TokenAccount info as value
 */
export type RequiredSplTokenAccounts = ReadonlyRecord<
  string,
  TokenAccountState
>;

export interface ToSolanaTransferState {
  readonly token: TokenConfig;
  readonly value: Decimal;
  readonly signatureSetAddress: string | null;
  readonly txIds: {
    readonly approveAndTransferEvmToken: readonly EvmTx["id"][];
    readonly postVaaOnSolana: readonly SolanaTx["id"][];
    readonly claimTokenOnSolana: SolanaTx["id"] | null;
  };
}

export interface SolanaPoolOperationState {
  readonly operation: OperationSpec;
  readonly txId: SolanaTx["id"] | null;
}

export interface FromSolanaTransferState {
  readonly token: TokenConfig;
  readonly value: Decimal | null;
  readonly txIds: {
    readonly transferSplToken: SolanaTx["id"] | null;
    readonly claimTokenOnEvm: EvmTx["id"] | null;
  };
}

export const isRequiredSplTokenAccountsCompleted = (
  accountState: RequiredSplTokenAccounts,
) =>
  Object.values(accountState).every(
    (state) => state.isExistingAccount || isNotNull(state.txId),
  );

export const isToSolanaTransferCompleted = (transfer: ToSolanaTransferState) =>
  isNotNull(transfer.txIds.claimTokenOnSolana);

export const isToSolanaTransfersCompleted = (
  transfers: readonly ToSolanaTransferState[],
) => transfers.every(isToSolanaTransferCompleted);

export const isSolanaPoolOperationsCompleted = (
  operations: readonly SolanaPoolOperationState[],
) => operations.every((operation) => isNotNull(operation.txId));

export const isFromSolanaTransferCompleted = (
  transfer: FromSolanaTransferState,
) => isNotNull(transfer.txIds.claimTokenOnEvm);

export const isFromSolanaTransfersCompleted = (
  transfers: readonly FromSolanaTransferState[],
) => transfers.every(isFromSolanaTransferCompleted);

export const isInteractionCompleted = ({
  requiredSplTokenAccounts,
  toSolanaTransfers,
  solanaPoolOperations,
  fromSolanaTransfers,
}: InteractionState) =>
  isRequiredSplTokenAccountsCompleted(requiredSplTokenAccounts) &&
  isToSolanaTransfersCompleted(toSolanaTransfers) &&
  isSolanaPoolOperationsCompleted(solanaPoolOperations) &&
  isFromSolanaTransfersCompleted(fromSolanaTransfers);

export const enum InteractionStatus {
  Incomplete,
  Active,
  Completed,
  Error,
}
