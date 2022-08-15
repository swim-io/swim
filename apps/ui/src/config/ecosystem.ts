import type { ReadonlyRecord } from "@swim-io/utils";
import { filterMap } from "@swim-io/utils";

const ACALA_SVG = "../images/ecosystems/acala.svg";
const AURORA_SVG = "../images/ecosystems/aurora.svg";
const AVALANCHE_SVG = "../images/ecosystems/avalanche.svg";
const BNB_SVG = "../images/ecosystems/bnb.svg";
const ETHEREUM_SVG = "../images/ecosystems/ethereum.svg";
const FANTOM_SVG = "../images/ecosystems/fantom.svg";
const KARURA_SVG = "../images/ecosystems/karura.svg";
const POLYGON_SVG = "../images/ecosystems/polygon.svg";
const SOLANA_SVG = "../images/ecosystems/solana.svg";

// import ACALA_SVG from "../images/ecosystems/acala.svg";
// import AURORA_SVG from "../images/ecosystems/aurora.svg";
// import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
// import BNB_SVG from "../images/ecosystems/bnb.svg";
// import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
// import FANTOM_SVG from "../images/ecosystems/fantom.svg";
// import KARURA_SVG from "../images/ecosystems/karura.svg";
// import POLYGON_SVG from "../images/ecosystems/polygon.svg";
// import SOLANA_SVG from "../images/ecosystems/solana.svg";

import { WormholeChainId } from "./wormhole";

export const enum Protocol {
  Solana = "solana-protocol",
  Evm = "evm",
}

export const PROTOCOL_NAMES: Record<Protocol, string> = {
  [Protocol.Solana]: "Solana",
  [Protocol.Evm]: "EVM",
};

/**
 * Maps 1:1 onto @certusone/wormhole-sdk ChainId
 * For a given Env, this encodes both Protocol and Protocol-specific ChainId
 * For a given Env, there should be no more than 1 ChainSpec with a given Ecosystem
 */
export enum EcosystemId {
  /** Only valid for Protocol.Solana chains */
  Solana = "solana",
  /** Only valid for Protocol.Evm chains */
  Ethereum = "ethereum",
  /** Only valid for Protocol.Evm chains */
  Bnb = "bnb",
  /** Only valid for Protocol.Evm chains */
  Avalanche = "avalanche",
  /** Only valid for Protocol.Evm chains */
  Polygon = "polygon",
  /** Only valid for Protocol.Evm chains */
  Aurora = "aurora",
  /** Only valid for Protocol.Evm chains */
  Fantom = "fantom",
  /** Only valid for Protocol.Evm chains */
  Karura = "karura",
  /** Only valid for Protocol.Evm chains */
  Acala = "acala",
}

export const ECOSYSTEM_IDS: readonly EcosystemId[] = Object.values(EcosystemId);

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case EcosystemId.Solana:
    case EcosystemId.Ethereum:
    case EcosystemId.Bnb:
    case EcosystemId.Avalanche:
    case EcosystemId.Polygon:
    case EcosystemId.Aurora:
    case EcosystemId.Fantom:
    case EcosystemId.Karura:
      return true;
    case EcosystemId.Acala:
      return !!process.env.REACT_APP_ENABLE_ACALA;
    default:
      return false;
  }
};

export type SolanaEcosystemId = Extract<EcosystemId, EcosystemId.Solana>;

export type EvmEcosystemId = Extract<
  EcosystemId,
  | EcosystemId.Ethereum
  | EcosystemId.Bnb
  | EcosystemId.Avalanche
  | EcosystemId.Polygon
  | EcosystemId.Aurora
  | EcosystemId.Fantom
  | EcosystemId.Karura
  | EcosystemId.Acala
>;

export const isEvmEcosystemId = (
  ecosystemId: EcosystemId,
): ecosystemId is EvmEcosystemId =>
  [
    EcosystemId.Ethereum,
    EcosystemId.Bnb,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
    EcosystemId.Aurora,
    EcosystemId.Fantom,
    EcosystemId.Karura,
    EcosystemId.Acala,
  ].includes(ecosystemId);

export interface Ecosystem {
  readonly id: EcosystemId;
  readonly protocol: Protocol;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
}

export const ECOSYSTEM_LIST: readonly Ecosystem[] = [
  {
    id: EcosystemId.Solana,
    protocol: Protocol.Solana,
    wormholeChainId: WormholeChainId.Solana,
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  {
    id: EcosystemId.Ethereum,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Ethereum,
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: EcosystemId.Bnb,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Bnb,
    displayName: "BNB Chain",
    logo: BNB_SVG,
    nativeTokenSymbol: "BNB",
  },
  {
    id: EcosystemId.Avalanche,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Avalanche,
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  {
    id: EcosystemId.Polygon,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Polygon,
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
  {
    id: EcosystemId.Aurora,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Aurora,
    displayName: "Aurora",
    logo: AURORA_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: EcosystemId.Fantom,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Fantom,
    displayName: "Fantom",
    logo: FANTOM_SVG,
    nativeTokenSymbol: "FTM",
  },
  {
    id: EcosystemId.Karura,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Karura,
    displayName: "Karura",
    logo: KARURA_SVG,
    nativeTokenSymbol: "KAR",
  },
  {
    id: EcosystemId.Acala,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Acala,
    displayName: "Acala",
    logo: ACALA_SVG,
    nativeTokenSymbol: "ACA",
  },
];

export const ECOSYSTEMS: ReadonlyRecord<EcosystemId, Ecosystem> =
  Object.fromEntries(
    ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.id, ecosystem]),
  ) as ReadonlyRecord<EcosystemId, Ecosystem>;

export const getEcosystemsForProtocol = (
  protocol: Protocol,
): readonly EcosystemId[] => {
  return filterMap(
    (ecosystem: Ecosystem) => ecosystem.protocol === protocol,
    (ecosystem) => ecosystem.id,
    ECOSYSTEM_LIST,
  );
};
