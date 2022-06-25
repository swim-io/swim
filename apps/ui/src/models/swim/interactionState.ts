import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { isNotNull } from "../../utils";
import type { EvmTx, SolanaTx } from "../crossEcosystem";

import type { Interaction } from "./interaction";
import type { OperationSpec } from "./operation";

export interface InteractionState {
  readonly interaction: Interaction;
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
  readonly toSolanaTransfers: readonly ToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly fromSolanaTransfers: readonly FromSolanaTransferState[];
}

export interface TokenAccountState {
  readonly isExistingAccount: boolean;
  readonly account: TokenAccount | null;
  readonly txId: SolanaTx["txId"] | null;
}

/**
 * Record with token mint address as key, TokenAccount info as value
 */
export type RequiredSplTokenAccounts = ReadonlyRecord<
  string,
  TokenAccountState
>;

export interface ToSolanaTransferState {
  readonly token: TokenSpec;
  readonly value: Decimal;
  readonly signatureSetAddress: string | null;
  readonly txIds: {
    readonly approveAndTransferEvmToken: readonly EvmTx["txId"][];
    readonly postVaaOnSolana: readonly SolanaTx["txId"][];
    readonly claimTokenOnSolana: SolanaTx["txId"] | null;
  };
}

export interface SolanaPoolOperationState {
  readonly operation: OperationSpec;
  readonly txId: SolanaTx["txId"] | null;
}

export interface FromSolanaTransferState {
  readonly token: TokenSpec;
  readonly value: Decimal | null;
  readonly txIds: {
    readonly transferSplToken: SolanaTx["txId"] | null;
    readonly claimTokenOnEvm: EvmTx["txId"] | null;
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
