import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import type { EvmTx, OperationSpec, SolanaTx } from "../../models";
import type { ReadonlyRecord } from "../../utils";

export interface InteractionState {
  readonly interactionId: string;
  readonly prepareSplTokenAccounts: PrepareSplTokenAccounts;
  readonly toSolanaTransfers: readonly ToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly fromSolanaTransfers: readonly FromSolanaTransferState[];
}

/**
 * Record with Account Mint as key, TokenAccount info as value
 */
export type PrepareSplTokenAccounts = ReadonlyRecord<
  string,
  TokenAccount | null
>;

export interface ToSolanaTransferState {
  readonly token: TokenSpec;
  readonly value: Decimal;
  readonly txs: {
    readonly approveAndTransferToken: readonly EvmTx[] | null;
    readonly postVaaOnSolana: readonly SolanaTx[] | null;
    readonly claimTokenOnSolana: SolanaTx | null;
  };
}

export interface SolanaPoolOperationState {
  readonly operation: OperationSpec;
  readonly tx: SolanaTx | null;
}

export interface FromSolanaTransferState {
  readonly token: TokenSpec;
  readonly value: Decimal | null;
  readonly txs: {
    readonly transferSplToken: SolanaTx | null;
    readonly claimTokenOnEvm: EvmTx | null;
  };
}

export const useInteractionState = (
  interactionId: string,
): InteractionState => {
  return {
    interactionId,
    prepareSplTokenAccounts: {},
    toSolanaTransfers: [],
    solanaPoolOperations: [],
    fromSolanaTransfers: [],
  };
};
