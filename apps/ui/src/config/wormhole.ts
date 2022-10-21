import type { ChainId, ChainName, EVMChainId } from "@certusone/wormhole-sdk";
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
} from "@certusone/wormhole-sdk";
import type { ReadonlyRecord } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";

import ACALA_SVG from "../images/ecosystems/acala.svg";
import ALGORAND_SVG from "../images/ecosystems/algorand.svg";
import APTOS_SVG from "../images/ecosystems/aptos.svg";
import AURORA_SVG from "../images/ecosystems/aurora.svg";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BNB_SVG from "../images/ecosystems/bnb.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import FANTOM_SVG from "../images/ecosystems/fantom.svg";
import KARURA_SVG from "../images/ecosystems/karura.svg";
import KLAYTN_SVG from "../images/ecosystems/klaytn.svg";
import OASIS_SVG from "../images/ecosystems/oasis.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import TERRA_SVG from "../images/ecosystems/terra.svg";

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

export const enum WormholeEcosystemId {
  Ethereum = "ethereum",
  Bsc = "bsc",
  Avalanche = "avalanche",
  Polygon = "polygon",
  Aurora = "aurora",
  Fantom = "fantom",
  Karura = "karura",
  Acala = "acala",
  Aptos = "aptos",
  Celo = "celo",
  Solana = "solana",
  Klaytn = "klaytn",
  Neon = "neon",
  Oasis = "oasis",
  Algorand = "algorand",
  Terra = "terra",
}

export interface WormholeEcosystem {
  readonly id: ChainName;
  readonly chainId: ChainId;
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
}

export const WORMHOLE_ECOSYSTEM_LIST: readonly WormholeEcosystem[] = [
  {
    id: WormholeEcosystemId.Aptos,
    chainId: WormholeChainId.Aptos,
    displayName: "Aptos",
    logo: APTOS_SVG,
    nativeTokenSymbol: "APT",
  },
  {
    id: WormholeEcosystemId.Solana,
    chainId: WormholeChainId.Solana,
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  {
    id: WormholeEcosystemId.Ethereum,
    chainId: WormholeChainId.Ethereum,
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: WormholeEcosystemId.Bsc,
    chainId: WormholeChainId.Bnb,
    displayName: "BNB Chain",
    logo: BNB_SVG,
    nativeTokenSymbol: "BNB",
  },
  {
    id: WormholeEcosystemId.Avalanche,
    chainId: WormholeChainId.Avalanche,
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  {
    id: WormholeEcosystemId.Polygon,
    chainId: WormholeChainId.Polygon,
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
  {
    id: WormholeEcosystemId.Aurora,
    chainId: WormholeChainId.Aurora,
    displayName: "Aurora",
    logo: AURORA_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: WormholeEcosystemId.Fantom,
    chainId: WormholeChainId.Fantom,
    displayName: "Fantom",
    logo: FANTOM_SVG,
    nativeTokenSymbol: "FTM",
  },
  {
    id: WormholeEcosystemId.Karura,
    chainId: WormholeChainId.Karura,
    displayName: "Karura",
    logo: KARURA_SVG,
    nativeTokenSymbol: "KAR",
  },
  {
    id: WormholeEcosystemId.Acala,
    chainId: WormholeChainId.Acala,
    displayName: "Acala",
    logo: ACALA_SVG,
    nativeTokenSymbol: "ACA",
  },
  {
    id: WormholeEcosystemId.Algorand,
    chainId: WormholeChainId.Algorand,
    displayName: "Algorand",
    logo: ALGORAND_SVG,
    nativeTokenSymbol: "ALGO",
  },
  {
    id: WormholeEcosystemId.Klaytn,
    chainId: WormholeChainId.Klaytn,
    displayName: "Klaytn",
    logo: KLAYTN_SVG,
    nativeTokenSymbol: "KLAY",
  },
  {
    id: WormholeEcosystemId.Oasis,
    chainId: WormholeChainId.Oasis,
    displayName: "Oasis",
    logo: OASIS_SVG,
    nativeTokenSymbol: "ROSE",
  },
  {
    id: WormholeEcosystemId.Terra,
    chainId: WormholeChainId.Terra,
    displayName: "Terra",
    logo: TERRA_SVG,
    nativeTokenSymbol: "LUNA",
  },
];

export const WORMHOLE_ECOSYSTEMS: ReadonlyRecord<
  WormholeEcosystemId,
  WormholeEcosystem
> = Object.fromEntries(
  WORMHOLE_ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.id, ecosystem]),
) as ReadonlyRecord<WormholeEcosystemId, WormholeEcosystem>;
