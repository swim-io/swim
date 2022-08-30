import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaEcosystemId } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { filterMap } from "@swim-io/utils";

import ACALA_SVG from "../images/ecosystems/acala.svg";
import AURORA_SVG from "../images/ecosystems/aurora.svg";
import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
import BNB_SVG from "../images/ecosystems/bnb.svg";
import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
import FANTOM_SVG from "../images/ecosystems/fantom.svg";
import KARURA_SVG from "../images/ecosystems/karura.svg";
import POLYGON_SVG from "../images/ecosystems/polygon.svg";
import SOLANA_SVG from "../images/ecosystems/solana.svg";

import { WormholeChainId } from "./wormhole";

export const enum Protocol {
  Solana = "solana-protocol",
  Evm = "evm",
}

export const PROTOCOL_NAMES: Record<Protocol, string> = {
  [Protocol.Solana]: "Solana",
  [Protocol.Evm]: "EVM",
};

export type EcosystemId = SolanaEcosystemId | EvmEcosystemId;

export const ECOSYSTEM_IDS: readonly EcosystemId[] = [
  SOLANA_ECOSYSTEM_ID,
  ...Object.values(EvmEcosystemId),
];

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case SOLANA_ECOSYSTEM_ID:
    case EvmEcosystemId.Ethereum:
    case EvmEcosystemId.Bnb:
    case EvmEcosystemId.Avalanche:
    case EvmEcosystemId.Polygon:
    case EvmEcosystemId.Aurora:
    case EvmEcosystemId.Fantom:
    case EvmEcosystemId.Karura:
      return true;
    case EvmEcosystemId.Acala:
      return !!process.env.REACT_APP_ENABLE_ACALA;
    default:
      return false;
  }
};

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
    id: SOLANA_ECOSYSTEM_ID,
    protocol: Protocol.Solana,
    wormholeChainId: WormholeChainId.Solana,
    displayName: "Solana",
    logo: SOLANA_SVG,
    nativeTokenSymbol: "SOL",
  },
  {
    id: EvmEcosystemId.Ethereum,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Ethereum,
    displayName: "Ethereum",
    logo: ETHEREUM_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: EvmEcosystemId.Bnb,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Bnb,
    displayName: "BNB Chain",
    logo: BNB_SVG,
    nativeTokenSymbol: "BNB",
  },
  {
    id: EvmEcosystemId.Avalanche,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Avalanche,
    displayName: "Avalanche",
    logo: AVALANCHE_SVG,
    nativeTokenSymbol: "AVAX",
  },
  {
    id: EvmEcosystemId.Polygon,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Polygon,
    displayName: "Polygon",
    logo: POLYGON_SVG,
    nativeTokenSymbol: "MATIC",
  },
  {
    id: EvmEcosystemId.Aurora,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Aurora,
    displayName: "Aurora",
    logo: AURORA_SVG,
    nativeTokenSymbol: "ETH",
  },
  {
    id: EvmEcosystemId.Fantom,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Fantom,
    displayName: "Fantom",
    logo: FANTOM_SVG,
    nativeTokenSymbol: "FTM",
  },
  {
    id: EvmEcosystemId.Karura,
    protocol: Protocol.Evm,
    wormholeChainId: WormholeChainId.Karura,
    displayName: "Karura",
    logo: KARURA_SVG,
    nativeTokenSymbol: "KAR",
  },
  {
    id: EvmEcosystemId.Acala,
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
