import { EcosystemId } from "../../config";

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
      ecosystem: EcosystemId.Solana,
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
        : EcosystemId.Solana;
    return {
      step: InteractionStateStep.ToSolanaTransfers,
      ecosystem,
      transferTokenId: token.id,
    };
  }

  if (!isSolanaPoolOperationsCompleted(solanaPoolOperations)) {
    return {
      step: InteractionStateStep.SolanaPoolOperations,
      ecosystem: EcosystemId.Solana,
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
        ? EcosystemId.Solana
        : token.nativeEcosystem;
    return {
      step: InteractionStateStep.FromSolanaTransfers,
      ecosystem,
      transferTokenId: token.id,
    };
  }

  return null;
};
