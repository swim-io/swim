import ACALA_SVG from "../images/ecosystems/acala.svg";
import AURORA_SVG from "../images/ecosystems/aurora.svg";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BSC_SVG from "../images/ecosystems/bsc.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import FANTOM_SVG from "../images/ecosystems/fantom.svg";
import KARURA_SVG from "../images/ecosystems/karura.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";
import TERRA_SVG from "../images/ecosystems/terra.svg";
import type { ReadonlyRecord } from "../utils";
import { filterMap } from "../utils";

import { WormholeChainId } from "./wormhole";

export const enum Protocol {
  Solana = "solana-protocol",
  Evm = "evm",
  Cosmos = "cosmos",
}

export const protocolNames: Record<Protocol, string> = {
  [Protocol.Solana]: "Solana",
  [Protocol.Evm]: "EVM",
  [Protocol.Cosmos]: "Cosmos",
};

/**
 * Maps 1:1 onto @certusone/wormhole-sdk ChainId
 * For a given Env, this encodes both Protocol and Protocol-specific ChainId
 * For a given Env, there should be no more than 1 ChainSpec with a given Ecosystem
 */
export const enum EcosystemId {
  /** Only valid for Protocol.Solana chains */
  Solana = "solana",
  /** Only valid for Protocol.Evm chains */
  Ethereum = "ethereum",
  /** Only valid for Protocol.Cosmos chains */
  Terra = "terra",
  /** Only valid for Protocol.Evm chains */
  Bsc = "bsc",
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

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case EcosystemId.Solana:
    case EcosystemId.Ethereum:
    case EcosystemId.Bsc:
    case EcosystemId.Avalanche:
    case EcosystemId.Polygon:
      return true;
    case EcosystemId.Aurora:
      return !!process.env.REACT_APP_ENABLE_AURORA;
    case EcosystemId.Fantom:
      return !!process.env.REACT_APP_ENABLE_FANTOM;
    case EcosystemId.Karura:
      return !!process.env.REACT_APP_ENABLE_KARURA;
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
  | EcosystemId.Bsc
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
    EcosystemId.Bsc,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
    EcosystemId.Aurora,
    EcosystemId.Fantom,
    EcosystemId.Karura,
    EcosystemId.Acala,
  ].includes(ecosystemId);

export type CosmosEcosystemId = Extract<EcosystemId, EcosystemId.Terra>;

export interface Ecosystem {
  readonly id: EcosystemId;
  readonly protocol: Protocol;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
}

export const ecosystemList: readonly Ecosystem[] = [
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
    id: EcosystemId.Terra,
    protocol: Protocol.Cosmos,
    wormholeChainId: WormholeChainId.Terra,
    displayName: "Terra",
    logo: TERRA_SVG,
    nativeTokenSymbol: "LUNA",
  },
  {
    id: EcosystemId.Bsc,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Bsc,
    displayName: "BNB Chain",
    logo: BSC_SVG,
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

export const ecosystems: ReadonlyRecord<EcosystemId, Ecosystem> =
  Object.fromEntries(
    ecosystemList.map((ecosystem) => [ecosystem.id, ecosystem]),
  ) as ReadonlyRecord<EcosystemId, Ecosystem>;

export const getEcosystemsForProtocol = (
  protocol: Protocol,
): readonly EcosystemId[] => {
  return filterMap(
    (ecosystem: Ecosystem) => ecosystem.protocol === protocol,
    (ecosystem) => ecosystem.id,
    ecosystemList,
  );
};
