import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type React from "react";

import { getFromEcosystemOfToSolanaTransfer } from "../../models";
import { isNotNull } from "../../utils";

import { Transfer } from "./Transfer";

interface Props {
  readonly interaction: Interaction;
  readonly transfer: ToSolanaTransferState;
  readonly isInteractionActive: boolean;
}

export const ToSolanaTransferComponent: React.FC<Props> = ({
  interaction,
  transfer,
  isInteractionActive,
}) => {
  const { token, txIds } = transfer;
  const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
    transfer,
    interaction,
  );
  const { approveAndTransferEvmToken, postVaaOnSolana, claimTokenOnSolana } =
    txIds;
  const approveAndTransferTxProps = approveAndTransferEvmToken.map((txId) => ({
    txId,
    ecosystem: token.nativeEcosystem,
  }));
  const postVaaTxProps = postVaaOnSolana.map((txId) => ({
    txId,
    ecosystem: SOLANA_ECOSYSTEM_ID,
  }));
  const claimTokenTxProp =
    claimTokenOnSolana !== null
      ? {
          txId: claimTokenOnSolana,
          ecosystem: SOLANA_ECOSYSTEM_ID,
        }
      : null;
  const completedTxProps = [
    ...approveAndTransferTxProps,
    ...postVaaTxProps,
    claimTokenTxProp,
  ].filter(isNotNull);

  const isPendingTransfer = claimTokenOnSolana === null;
  const isLoading = isInteractionActive && isPendingTransfer;

  return (
    <Transfer
      token={token}
      from={fromEcosystem}
      to={SOLANA_ECOSYSTEM_ID}
      isLoading={isLoading}
      transactions={completedTxProps}
    />
  );
};
