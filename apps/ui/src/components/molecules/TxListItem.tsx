import { EuiListGroupItem } from "@elastic/eui";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type { FC } from "react";

import type { EcosystemId } from "../../config";

interface Props {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
}

const getHref = (ecosystemId: EcosystemId, txId: string): string => {
  // TODO: Support different environments (devnet).
  switch (ecosystemId) {
    case SOLANA_ECOSYSTEM_ID:
      return `https://solana.fm/tx/${txId}`;
    case ETHEREUM_ECOSYSTEM_ID:
      return `https://etherscan.io/tx/${txId}`;
    case BNB_ECOSYSTEM_ID:
      return `https://bscscan.com/tx/${txId}`;
    // case AVALANCHE_ECOSYSTEM_ID:
    //   return `https://snowtrace.io/tx/${txId}`;
    // case POLYGON_ECOSYSTEM_ID:
    //   return `https://polygonscan.com/tx/${txId}`;
    // case AURORA_ECOSYSTEM_ID:
    //   return `https://aurorascan.dev/tx/${txId}`;
    // case FANTOM_ECOSYSTEM_ID:
    //   return `https://ftmscan.com/tx/${txId}`;
    // case KARURA_ECOSYSTEM_ID:
    //   return `https://blockscout.karura.network/tx/${txId}`;
    // case ACALA_ECOSYSTEM_ID:
    //   return `https://blockscout.acala.network/tx/${txId}`;
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
