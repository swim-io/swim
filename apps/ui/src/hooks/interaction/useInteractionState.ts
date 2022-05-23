import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import type { EvmTx, OperationSpec, SolanaTx } from "../../models";
import type { ReadonlyRecord } from "../../utils";

export interface InteractionState {
  readonly interactionId: string;
  readonly prepareSplTokenAccountsState: PrepareSplTokenAccountsState;
  readonly wormholeToSolanaTransfers: readonly WormholeToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly wormholeFromSolanaTransfers: readonly WormholeFromSolanaTransferState[];
}

type Mint = string;
export type PrepareSplTokenAccountsState = ReadonlyRecord<
  Mint,
  TokenAccount | null
>;

export interface WormholeToSolanaTransferState {
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

export interface WormholeFromSolanaTransferState {
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
    prepareSplTokenAccountsState: {},
    wormholeToSolanaTransfers: [],
    solanaPoolOperations: [],
    wormholeFromSolanaTransfers: [],
  };
};
