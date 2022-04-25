import { EuiListGroupItem } from "@elastic/eui";
import type { FC } from "react";

import { EcosystemId } from "../config";

interface TxListItemProps {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
}

export const SolanaTxListItem: FC<TxListItemProps> = ({
  txId,
}: TxListItemProps) => (
  <EuiListGroupItem
    label={txId}
    href={`https://explorer.solana.com/tx/${txId}`}
    target="_blank"
    iconType="check"
    size="s"
  />
);

const EthereumTxListItem: FC<TxListItemProps> = ({ txId }: TxListItemProps) => (
  <EuiListGroupItem
    label={txId}
    href={`https://etherscan.io/tx/${txId}`}
    target="_blank"
    iconType="check"
    size="s"
  />
);

const BscTxListItem: FC<TxListItemProps> = ({ txId }: TxListItemProps) => (
  <EuiListGroupItem
    label={txId}
    href={`https://bscscan.com/tx/${txId}`}
    target="_blank"
    iconType="check"
    size="s"
  />
);

const AvalancheTxListItem: FC<TxListItemProps> = ({
  txId,
}: TxListItemProps) => (
  <EuiListGroupItem
    label={txId}
    href={`https://snowtrace.io/tx/${txId}`}
    target="_blank"
    iconType="check"
    size="s"
  />
);

const PolygonTxListItem: FC<TxListItemProps> = ({ txId }: TxListItemProps) => (
  <EuiListGroupItem
    label={txId}
    href={`https://polygonscan.com/tx/${txId}`}
    target="_blank"
    iconType="check"
    size="s"
  />
);

export const TxListItem: FC<TxListItemProps> = (tx: TxListItemProps) => {
  switch (tx.ecosystem) {
    case EcosystemId.Solana:
      return <SolanaTxListItem {...tx} />;
    case EcosystemId.Ethereum:
      return <EthereumTxListItem {...tx} />;
    case EcosystemId.Bsc:
      return <BscTxListItem {...tx} />;
    case EcosystemId.Avalanche:
      return <AvalancheTxListItem {...tx} />;
    case EcosystemId.Polygon:
      return <PolygonTxListItem {...tx} />;
    default:
      throw new Error("Unknown transaction ecosystem");
  }
};
