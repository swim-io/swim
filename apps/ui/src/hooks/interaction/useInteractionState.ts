import type { AccountInfo } from "@solana/spl-token";
import type Decimal from "decimal.js";

import type { EcosystemId, EvmEcosystemId, TokenSpec } from "../../config";
import type { EvmTx, OperationSpec, SolanaTx } from "../../models";
import type { ReadonlyRecord } from "../../utils";

import { usePrepareSplTokenAccountsState } from "./usePrepareSplTokenAccountsState";
import { useSolanaPoolOperationState } from "./useSolanaPoolOperationsState";
import { useWormholeFromSolanaTransfersState } from "./useWormholeFromSolanaTransfersState";
import { useWormholeToSolanaTransfersState } from "./useWormholeToSolanaTransfersState";

export interface InteractionState {
  readonly interactionId: string;
  readonly prepareSplTokenAccountsState: PrepareSplTokenAccountsState;
  readonly wormholeToSolanaTransfers: readonly WormholeToSolanaTransferState[];
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly wormholeFromSolanaTransfers: readonly WormholeFromSolanaTransferState[];
}

type Mint = string;
export interface PrepareSplTokenAccountsState {
  readonly tokenAccountState: ReadonlyRecord<Mint, AccountInfo | null>;
}

export interface WormholeToSolanaTransferState {
  readonly id: string;
  readonly interactionId: string;
  readonly token: TokenSpec;
  readonly value: Decimal;
  readonly fromEcosystem: EvmEcosystemId;
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
  readonly id: string;
  readonly token: TokenSpec;
  readonly value: Decimal | null;
  readonly toEcosystem: EcosystemId;
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
    prepareSplTokenAccountsState:
      usePrepareSplTokenAccountsState(interactionId),
    wormholeToSolanaTransfers: useWormholeToSolanaTransfersState(interactionId),
    solanaPoolOperations: useSolanaPoolOperationState(interactionId),
    wormholeFromSolanaTransfers:
      useWormholeFromSolanaTransfersState(interactionId),
  };
};
