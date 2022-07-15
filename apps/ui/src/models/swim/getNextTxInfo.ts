import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

import type { EcosystemId } from "../../config";

import type { InteractionState } from "./interactionState";
import {
  isFromSolanaTransfersCompleted,
  isRequiredSplTokenAccountsCompleted,
  isSolanaPoolOperationsCompleted,
  isToSolanaTransfersCompleted,
} from "./interactionState";

export const enum InteractionStateStep {
  PrepareSplTokenAccounts,
  ToSolanaTransfers,
  SolanaPoolOperations,
  FromSolanaTransfers,
}
interface NextTxInfo {
  readonly step: InteractionStateStep;
  readonly ecosystem: EcosystemId;
  readonly transferTokenId: string | null;
}

export const getNextTxInfo = ({
  requiredSplTokenAccounts,
  toSolanaTransfers,
  solanaPoolOperations,
  fromSolanaTransfers,
}: InteractionState): NextTxInfo | null => {
  if (!isRequiredSplTokenAccountsCompleted(requiredSplTokenAccounts)) {
    return {
      step: InteractionStateStep.PrepareSplTokenAccounts,
      ecosystem: SOLANA_ECOSYSTEM_ID,
      transferTokenId: null,
    };
  }

  if (!isToSolanaTransfersCompleted(toSolanaTransfers)) {
    const incompleteTransfer = toSolanaTransfers.find(
      (transfer) => transfer.txIds.claimTokenOnSolana === null,
    );
    if (!incompleteTransfer) {
      throw new Error("Should find incomplete transfer");
    }
    const { txIds, token } = incompleteTransfer;
    const ecosystem =
      txIds.approveAndTransferEvmToken.length === 0
        ? token.nativeEcosystem
        : SOLANA_ECOSYSTEM_ID;
    return {
      step: InteractionStateStep.ToSolanaTransfers,
      ecosystem,
      transferTokenId: token.id,
    };
  }

  if (!isSolanaPoolOperationsCompleted(solanaPoolOperations)) {
    return {
      step: InteractionStateStep.SolanaPoolOperations,
      ecosystem: SOLANA_ECOSYSTEM_ID,
      transferTokenId: null,
    };
  }

  if (!isFromSolanaTransfersCompleted(fromSolanaTransfers)) {
    const incompleteTransfer = fromSolanaTransfers.find(
      (transfer) => transfer.txIds.claimTokenOnEvm === null,
    );
    if (!incompleteTransfer) {
      throw new Error("Should find incomplete transfer");
    }
    const { txIds, token } = incompleteTransfer;
    const ecosystem =
      txIds.transferSplToken === null
        ? SOLANA_ECOSYSTEM_ID
        : token.nativeEcosystem;
    return {
      step: InteractionStateStep.FromSolanaTransfers,
      ecosystem,
      transferTokenId: token.id,
    };
  }

  return null;
};
