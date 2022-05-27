import { EuiListGroup, EuiText } from "@elastic/eui";
import type React from "react";

import { EcosystemId, ecosystems } from "../../config";
import type { FromSolanaTransferState } from "../../models";
import { isNotNull } from "../../utils";

import { TxListItem } from "./TxListItem";

interface Props {
  readonly transfer: FromSolanaTransferState;
}

export const FromSolanaTransferComponent: React.FC<Props> = ({ transfer }) => {
  const { token, txIds } = transfer;
  const toEcosystem = ecosystems[token.nativeEcosystem].displayName;
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
  return (
    <EuiText size="m">
      <span>{`Transfer ${token.displayName} from Solana to ${toEcosystem}`}</span>
      <br />
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {completedTxs.map((tx) => (
          <TxListItem key={tx.txId} {...tx} />
        ))}
      </EuiListGroup>
    </EuiText>
  );
};
