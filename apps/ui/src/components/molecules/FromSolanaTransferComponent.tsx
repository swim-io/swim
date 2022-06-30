import type React from "react";

import { EcosystemId } from "../../config";
import type { FromSolanaTransferState, Interaction } from "../../models";
import { getToEcosystemOfFromSolanaTransfer } from "../../models";
import { isNotNull } from "../../utils";

import { Transfer } from "./Transfer";

interface Props {
  readonly interaction: Interaction;
  readonly transfer: FromSolanaTransferState;
  readonly isInteractionActive: boolean;
}

export const FromSolanaTransferComponent: React.FC<Props> = ({
  interaction,
  transfer,
  isInteractionActive,
}) => {
  const { token, txIds } = transfer;
  const toEcosystem = getToEcosystemOfFromSolanaTransfer(transfer, interaction);
  const { transferSplToken, claimTokenOnEvm } = txIds;
  const transferSplTokenTxProps = transferSplToken
    ? {
        txId: transferSplToken,
        ecosystem: EcosystemId.Solana,
      }
    : null;
  const claimTokenOnEvmTxProps = claimTokenOnEvm
    ? {
        txId: claimTokenOnEvm,
        ecosystem: token.nativeEcosystem,
      }
    : null;

  const completedTxs = [transferSplTokenTxProps, claimTokenOnEvmTxProps].filter(
    isNotNull,
  );

  const isPendingTransfer = claimTokenOnEvm === null;
  const isLoading = isInteractionActive && isPendingTransfer;

  return (
    <Transfer
      token={token}
      from={EcosystemId.Solana}
      to={toEcosystem}
      isLoading={isLoading}
      transactions={completedTxs}
    />
  );
};
