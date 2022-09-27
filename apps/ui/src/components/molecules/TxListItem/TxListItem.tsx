import { EuiListGroupItem } from "@elastic/eui";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { FC } from "react";

import type { EcosystemId } from "../../../config";

interface Props {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
}

const getHref = (ecosystemId: EcosystemId, txId: string): string => {
  // TODO: Support different environments (ie testnets).
  switch (ecosystemId) {
    case SOLANA_ECOSYSTEM_ID:
      return `https://solana.fm/tx/${txId}`;
    case EvmEcosystemId.Ethereum:
      return `https://etherscan.io/tx/${txId}`;
    case EvmEcosystemId.Bnb:
      return `https://bscscan.com/tx/${txId}`;
    case EvmEcosystemId.Avalanche:
      return `https://snowtrace.io/tx/${txId}`;
    case EvmEcosystemId.Polygon:
      return `https://polygonscan.com/tx/${txId}`;
    case EvmEcosystemId.Aurora:
      return `https://aurorascan.dev/tx/${txId}`;
    case EvmEcosystemId.Fantom:
      return `https://ftmscan.com/tx/${txId}`;
    case EvmEcosystemId.Karura:
      return `https://blockscout.karura.network/tx/${txId}`;
    case EvmEcosystemId.Acala:
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
