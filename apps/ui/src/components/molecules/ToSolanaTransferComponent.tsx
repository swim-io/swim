import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type React from "react";

import { EcosystemId, ecosystems } from "../../config";
import type { Interaction, ToSolanaTransferState } from "../../models";
import { getFromEcosystemOfToSolanaTransfer } from "../../models";
import { isNotNull } from "../../utils";

import { TxListItem } from "./TxListItem";

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
  const fromEcosystemDisplayName = ecosystems[fromEcosystem].displayName;
  const { approveAndTransferEvmToken, postVaaOnSolana, claimTokenOnSolana } =
    txIds;
  const approveAndTransferTxProps = approveAndTransferEvmToken.map((txId) => ({
    txId,
    ecosystem: token.nativeEcosystem,
  }));
  const postVaaTxProps = postVaaOnSolana.map((txId) => ({
    txId,
    ecosystem: EcosystemId.Solana,
  }));
  const claimTokenTxProp =
    claimTokenOnSolana !== null
      ? {
          txId: claimTokenOnSolana,
          ecosystem: EcosystemId.Solana,
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
    <EuiText size="m">
      <span>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>{`Transfer ${token.displayName} from ${fromEcosystemDisplayName} to Solana`}</span>
      </span>
      <br />
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {completedTxProps.map(({ txId, ecosystem }) => (
          <TxListItem key={txId} txId={txId} ecosystem={ecosystem} />
        ))}
      </EuiListGroup>
    </EuiText>
  );
};
