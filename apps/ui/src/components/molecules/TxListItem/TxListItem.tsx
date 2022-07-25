import { EuiListGroupItem } from "@elastic/eui";
import type { FC } from "react";

import { EcosystemId } from "../../../config";

interface Props {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
}

const getHref = (ecosystemId: EcosystemId, txId: string): string => {
  // TODO: Support different environments (devnet).
  switch (ecosystemId) {
    case EcosystemId.Solana:
      return `https://solana.fm/tx/${txId}`;
    case EcosystemId.Ethereum:
      return `https://etherscan.io/tx/${txId}`;
    case EcosystemId.Bnb:
      return `https://bscscan.com/tx/${txId}`;
    case EcosystemId.Avalanche:
      return `https://snowtrace.io/tx/${txId}`;
    case EcosystemId.Polygon:
      return `https://polygonscan.com/tx/${txId}`;
    case EcosystemId.Aurora:
      return `https://aurorascan.dev/tx/${txId}`;
    case EcosystemId.Fantom:
      return `https://ftmscan.com/tx/${txId}`;
    case EcosystemId.Karura:
      return `https://blockscout.karura.network/tx/${txId}`;
    case EcosystemId.Acala:
      return `https://blockscout.acala.network/tx/${txId}`;
    default:
      throw new Error("Unknown ecosystem");
  }
};

export const TxListItem: FC<Props> = ({ ecosystem, txId }) => {
  const href = getHref(ecosystem, txId);
  return (
    <EuiListGroupItem
      label={txId}
      href={href}
      target="_blank"
      iconType="check"
      size="s"
    />
  );
};
