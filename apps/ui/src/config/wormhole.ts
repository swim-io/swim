import type { ChainId, EVMChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_ACALA,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_ETHEREUM_ROPSTEN,
  CHAIN_ID_FANTOM,
  CHAIN_ID_GNOSIS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_NEON,
  CHAIN_ID_OASIS,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_POLYGON,
  CHAIN_ID_PYTHNET,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_TERRA,
  CHAIN_ID_TERRA2,
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
  readonly chainId: ChainId;
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
}

export const WORMHOLE_ECOSYSTEM_LIST: readonly WormholeEcosystem[] = [
  {
    chainId: CHAIN_ID_APTOS,
    displayName: "Aptos",
    logo: "",
    nativeTokenSymbol: "APT",
  },
  {
    chainId: CHAIN_ID_SOLANA,
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  {
    chainId: CHAIN_ID_ETH,
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    chainId: CHAIN_ID_BSC,
    displayName: "BNB Chain",
    logo: BNB_SVG,
    nativeTokenSymbol: "BNB",
  },
  {
    chainId: CHAIN_ID_AVAX,
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  {
    chainId: CHAIN_ID_POLYGON,
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
  {
    chainId: CHAIN_ID_AURORA,
    displayName: "Aurora",
    logo: AURORA_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    chainId: CHAIN_ID_FANTOM,
    displayName: "Fantom",
    logo: FANTOM_SVG,
    nativeTokenSymbol: "FTM",
  },
  {
    chainId: CHAIN_ID_KARURA,
    displayName: "Karura",
    logo: KARURA_SVG,
    nativeTokenSymbol: "KAR",
  },
  {
    chainId: CHAIN_ID_ACALA,
    displayName: "Acala",
    logo: ACALA_SVG,
    nativeTokenSymbol: "ACA",
  },
  {
    chainId: CHAIN_ID_ALGORAND,
    displayName: "Algorand",
    logo: "",
    nativeTokenSymbol: "ALGO",
  },
  {
    chainId: CHAIN_ID_KLAYTN,
    displayName: "Klaytn",
    logo: "",
    nativeTokenSymbol: "KLAY",
  },
  {
    chainId: CHAIN_ID_OASIS,
    displayName: "Oasis",
    logo: "",
    nativeTokenSymbol: "ROSE",
  },
  {
    chainId: CHAIN_ID_TERRA,
    displayName: "Terra",
    logo: "",
    nativeTokenSymbol: "LUNA",
  },
  {
    chainId: CHAIN_ID_ARBITRUM,
    displayName: "Arbitrum",
    logo: "",
    nativeTokenSymbol: "",
  },
  {
    chainId: CHAIN_ID_CELO,
    displayName: "Celo",
    logo: "",
    nativeTokenSymbol: "CELO",
  },
  {
    chainId: CHAIN_ID_OPTIMISM,
    displayName: "Optimism",
    logo: "",
    nativeTokenSymbol: "OP",
  },
  {
    chainId: CHAIN_ID_TERRA2,
    displayName: "TerraClassic",
    logo: "",
    nativeTokenSymbol: "LUNC",
  },
  {
    chainId: CHAIN_ID_GNOSIS,
    displayName: "Gnosis",
    logo: "",
    nativeTokenSymbol: "GNO",
  },
  {
    chainId: CHAIN_ID_INJECTIVE,
    displayName: "Injective",
    logo: "",
    nativeTokenSymbol: "INJ",
  },
  {
    chainId: CHAIN_ID_MOONBEAM,
    displayName: "Moonbeam",
    logo: "",
    nativeTokenSymbol: "GLMR",
  },
  {
    chainId: CHAIN_ID_NEON,
    displayName: "Neon",
    logo: "",
    nativeTokenSymbol: "NEON",
  },
  {
    chainId: CHAIN_ID_OSMOSIS,
    displayName: "Osmosis",
    logo: "",
    nativeTokenSymbol: "OSMO",
  },
  {
    chainId: CHAIN_ID_SUI,
    displayName: "Sui",
    logo: "",
    nativeTokenSymbol: "SUI",
  },
  {
    chainId: CHAIN_ID_PYTHNET,
    displayName: "Pyth",
    logo: "",
    nativeTokenSymbol: "PYTH",
  },
];

export const WORMHOLE_ECOSYSTEMS: ReadonlyRecord<ChainId, WormholeEcosystem> =
  Object.fromEntries(
    WORMHOLE_ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.chainId, ecosystem]),
  ) as ReadonlyRecord<ChainId, WormholeEcosystem>;
