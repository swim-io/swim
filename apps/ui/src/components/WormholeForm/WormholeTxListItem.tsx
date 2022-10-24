import {
  CHAIN_ID_ACALA,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_FANTOM,
  CHAIN_ID_GNOSIS,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_NEON,
  CHAIN_ID_OASIS,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import type { ChainId } from "@certusone/wormhole-sdk";
import { EuiListGroupItem } from "@elastic/eui";
import type { FC } from "react";

interface Props {
  readonly chainId: ChainId;
  readonly txId: string;
}

const getHref = (chainId: ChainId, txId: string): string => {
  switch (chainId) {
    case CHAIN_ID_SOLANA:
      return `https://solana.fm/tx/${txId}`;
    case CHAIN_ID_ETH:
      return `https://etherscan.io/tx/${txId}`;
    case CHAIN_ID_BSC:
      return `https://bscscan.com/tx/${txId}`;
    case CHAIN_ID_AVAX:
      return `https://snowtrace.io/tx/${txId}`;
    case CHAIN_ID_POLYGON:
      return `https://polygonscan.com/tx/${txId}`;
    case CHAIN_ID_AURORA:
      return `https://aurorascan.dev/tx/${txId}`;
    case CHAIN_ID_FANTOM:
      return `https://ftmscan.com/tx/${txId}`;
    case CHAIN_ID_KARURA:
      return `https://blockscout.karura.network/tx/${txId}`;
    case CHAIN_ID_ACALA:
      return `https://blockscout.acala.network/tx/${txId}`;
    case CHAIN_ID_CELO:
      return `https://explorer.celo.org/mainnet/tx/${txId}`;
    case CHAIN_ID_ARBITRUM:
      return `https://arbiscan.io/tx/${txId}`;
    case CHAIN_ID_GNOSIS:
      return `https://gnosisscan.io/tx/${txId}`;
    case CHAIN_ID_KLAYTN:
      return `https://scope.klaytn.com/tx/${txId}`;
    case CHAIN_ID_MOONBEAM:
      return `https://moonscan.io/tx/${txId}`;
    case CHAIN_ID_NEON:
      return `https://neonscan.org/tx/${txId}`;
    case CHAIN_ID_OASIS:
      return `https://www.oasisscan.com/transactions/${txId}`;
    case CHAIN_ID_OPTIMISM:
      return `https://optimistic.etherscan.io/tx/${txId}`;
    default:
      throw new Error("Unknown chainId");
  }
};

export const WormholeTxListItem: FC<Props> = ({ chainId, txId }) => {
  const href = getHref(chainId, txId);
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
