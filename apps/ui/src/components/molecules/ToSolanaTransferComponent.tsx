import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type React from "react";

import { EcosystemId, ecosystems } from "../../config";
import type { ToSolanaTransferState } from "../../models";
import { isNotNull } from "../../utils";

import { TxListItem } from "./TxListItem";

interface Props {
  readonly transfer: ToSolanaTransferState;
  readonly isInteractionActive: boolean;
}

export const ToSolanaTransferComponent: React.FC<Props> = ({
  transfer,
  isInteractionActive,
}) => {
  const { token, txIds } = transfer;
  const fromEcosystem = ecosystems[token.nativeEcosystem].displayName;
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
        {isLoading && (
          <>
            <EuiLoadingSpinner size="m" />{" "}
          </>
        )}
        <span>{`Transfer ${token.displayName} from ${fromEcosystem} to Solana`}</span>
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
