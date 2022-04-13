import AVALANCHE_SVG from "../images/avalanche.svg";
import BSC_SVG from "../images/bsc.svg";
import ETHEREUM_SVG from "../images/ethereum.svg";
import POLYGON_SVG from "../images/polygon.svg";
import SOLANA_SVG from "../images/solana.svg";
import TERRA_SVG from "../images/terra.svg";
import type { ReadonlyRecord } from "../utils";

import { WormholeChainId } from "./wormhole";

export const enum Protocol {
  Solana = "solana-protocol",
  Evm = "evm",
  Cosmos = "cosmos",
}

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
}

export type SolanaEcosystemId = Extract<EcosystemId, EcosystemId.Solana>;

export type EvmEcosystemId = Extract<
  EcosystemId,
  | EcosystemId.Ethereum
  | EcosystemId.Bsc
  | EcosystemId.Avalanche
  | EcosystemId.Polygon
>;

export const isEvmEcosystemId = (
  ecosystemId: EcosystemId,
): ecosystemId is EvmEcosystemId =>
  [
    EcosystemId.Ethereum,
    EcosystemId.Bsc,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
  ].includes(ecosystemId);

export type CosmosEcosystemId = Extract<EcosystemId, EcosystemId.Terra>;

export interface Ecosystem {
  readonly protocol: Protocol;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly logo: string;
  readonly nativeTokenSymbol: string;
}

export const ecosystems: ReadonlyRecord<EcosystemId, Ecosystem> = {
  [EcosystemId.Solana]: {
    protocol: Protocol.Solana,
    wormholeChainId: WormholeChainId.Solana,
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  [EcosystemId.Ethereum]: {
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Ethereum,
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  [EcosystemId.Terra]: {
    protocol: Protocol.Cosmos,
    wormholeChainId: WormholeChainId.Terra,
    displayName: "Terra",
    logo: TERRA_SVG,
    nativeTokenSymbol: "LUNA",
  },
  [EcosystemId.Bsc]: {
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Bsc,
    displayName: "BNB Chain",
    logo: BSC_SVG,
    nativeTokenSymbol: "BNB",
  },
  [EcosystemId.Avalanche]: {
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Avalanche,
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  [EcosystemId.Polygon]: {
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Polygon,
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
};
