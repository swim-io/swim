import type { EVMChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_ACALA,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_ETHEREUM_ROPSTEN,
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
import type { ReadonlyRecord } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";

import ACALA_SVG from "../images/ecosystems/acala.svg";
import AURORA_SVG from "../images/ecosystems/aurora.svg";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BNB_SVG from "../images/ecosystems/bnb.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import FANTOM_SVG from "../images/ecosystems/fantom.svg";
import KARURA_SVG from "../images/ecosystems/karura.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";

// We currently use this with Wormhole SDK’s getSignedVAAWithRetry function.
// By default this function retries every 1 second.
export const getWormholeRetries = (chainId: WormholeChainId): number => {
  switch (chainId) {
    // Ethereum requires up to 95 confirmations for finality, or roughly 19 minutes
    case WormholeChainId.Ethereum:
      return 1200;
    // Polygon requires 512 confirmations for finality, or roughly 18 minutes.
    case WormholeChainId.Polygon:
      return 1200;
    default:
      return 300;
  }
};

export const EVM_NETWORKS: ReadonlyRecord<EVMChainId, number> = {
  [CHAIN_ID_ETH]: 1,
  [CHAIN_ID_BSC]: 56,
  [CHAIN_ID_POLYGON]: 137,
  [CHAIN_ID_AVAX]: 43114,
  [CHAIN_ID_OASIS]: 42262,
  [CHAIN_ID_AURORA]: 1313161554,
  [CHAIN_ID_FANTOM]: 250,
  [CHAIN_ID_KARURA]: 686,
  [CHAIN_ID_ACALA]: 787,
  [CHAIN_ID_KLAYTN]: 8217,
  [CHAIN_ID_CELO]: 42220,
  [CHAIN_ID_MOONBEAM]: 1284,
  [CHAIN_ID_NEON]: 245022934,
  [CHAIN_ID_ARBITRUM]: 42161,
  [CHAIN_ID_OPTIMISM]: 10,
  [CHAIN_ID_GNOSIS]: 100,
  [CHAIN_ID_ETHEREUM_ROPSTEN]: 3,
};

export interface WormholeEcosystem {
  readonly displayName: string;
  readonly logo: string | null;
  readonly nativeTokenSymbol: string;
}

export type SupportedChainId = EVMChainId | typeof CHAIN_ID_SOLANA;

export const WORMHOLE_ECOSYSTEMS: ReadonlyRecord<
  SupportedChainId,
  WormholeEcosystem
> = {
  [CHAIN_ID_SOLANA]: {
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  [CHAIN_ID_ETH]: {
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  [CHAIN_ID_BSC]: {
    displayName: "BNB Chain",
    logo: BNB_SVG,
    nativeTokenSymbol: "BNB",
  },
  [CHAIN_ID_AVAX]: {
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  [CHAIN_ID_POLYGON]: {
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
  [CHAIN_ID_AURORA]: {
    displayName: "Aurora",
    logo: AURORA_SVG,
    nativeTokenSymbol: "ETH",
  },
  [CHAIN_ID_FANTOM]: {
    displayName: "Fantom",
    logo: FANTOM_SVG,
    nativeTokenSymbol: "FTM",
  },
  [CHAIN_ID_KARURA]: {
    displayName: "Karura",
    logo: KARURA_SVG,
    nativeTokenSymbol: "KAR",
  },
  [CHAIN_ID_ACALA]: {
    displayName: "Acala",
    logo: ACALA_SVG,
    nativeTokenSymbol: "ACA",
  },
  [CHAIN_ID_KLAYTN]: {
    displayName: "Klaytn",
    logo: null,
    nativeTokenSymbol: "KLAY",
  },
  [CHAIN_ID_OASIS]: {
    displayName: "Oasis",
    logo: null,
    nativeTokenSymbol: "ROSE",
  },
  [CHAIN_ID_ARBITRUM]: {
    displayName: "Arbitrum",
    logo: null,
    nativeTokenSymbol: "",
  },
  [CHAIN_ID_CELO]: {
    displayName: "Celo",
    logo: null,
    nativeTokenSymbol: "CELO",
  },
  [CHAIN_ID_OPTIMISM]: {
    displayName: "Optimism",
    logo: null,
    nativeTokenSymbol: "OP",
  },
  [CHAIN_ID_GNOSIS]: {
    displayName: "Gnosis",
    logo: null,
    nativeTokenSymbol: "GNO",
  },
  [CHAIN_ID_MOONBEAM]: {
    displayName: "Moonbeam",
    logo: null,
    nativeTokenSymbol: "GLMR",
  },
  [CHAIN_ID_NEON]: {
    displayName: "Neon",
    logo: null,
    nativeTokenSymbol: "NEON",
  },
  [CHAIN_ID_ETHEREUM_ROPSTEN]: {
    displayName: "Ropsten",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
};
