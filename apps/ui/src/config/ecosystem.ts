import type { EcosystemConfig } from "@swim-io/core-types";
import type * as CoreTypes from "@swim-io/core-types";
import * as EvmTypes from "@swim-io/evm-types";
import * as BnbConfig from "@swim-io/plugin-ecosystem-bnb";
import * as EthereumConfig from "@swim-io/plugin-ecosystem-ethereum";
import * as SolanaConfig from "@swim-io/plugin-ecosystem-solana";

// import ACALA_SVG from "../images/ecosystems/acala.svg";
// import AURORA_SVG from "../images/ecosystems/aurora.svg";
// import AVALANCHE_SVG from "../images/ecosystems/avalanche.svg";
// import BNB_SVG from "../images/ecosystems/bnb.svg";
// import ETHEREUM_SVG from "../images/ecosystems/ethereum.svg";
// import FANTOM_SVG from "../images/ecosystems/fantom.svg";
// import KARURA_SVG from "../images/ecosystems/karura.svg";
// import POLYGON_SVG from "../images/ecosystems/polygon.svg";
// import SOLANA_SVG from "../images/ecosystems/solana.svg";
import type { ReadonlyRecord } from "../utils";
import { filterMap } from "../utils";

// import { WormholeChainId } from "./wormhole";

export type SolanaProtocol = "solana-protocol";
export const SOLANA_PROTOCOL: SolanaProtocol = "solana-protocol";
export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export const PROTOCOL_NAMES: Record<string, string> = {
  [SOLANA_PROTOCOL]: "Solana",
  [EVM_PROTOCOL]: "EVM",
};

// /**
//  * Maps 1:1 onto @certusone/wormhole-sdk ChainId
//  * For a given Env, this encodes both Protocol and Protocol-specific ChainId
//  * For a given Env, there should be no more than 1 ChainSpec with a given Ecosystem
//  */
// export enum EcosystemId {
//   /** Only valid for Protocol.Solana chains */
//   Solana = "solana",
//   /** Only valid for Protocol.Evm chains */
//   Ethereum = "ethereum",
//   /** Only valid for Protocol.Evm chains */
//   Bnb = "bnb",
//   /** Only valid for Protocol.Evm chains */
//   Avalanche = "avalanche",
//   /** Only valid for Protocol.Evm chains */
//   Polygon = "polygon",
//   /** Only valid for Protocol.Evm chains */
//   Aurora = "aurora",
//   /** Only valid for Protocol.Evm chains */
//   Fantom = "fantom",
//   /** Only valid for Protocol.Evm chains */
//   Karura = "karura",
//   /** Only valid for Protocol.Evm chains */
//   Acala = "acala",
// }

export type EvmEcosystemId =
  | EthereumConfig.EthereumEcosystemId
  | BnbConfig.BnbEcosystemId;
export type SolanaEcosystemId = SolanaConfig.SolanaEcosystemId;
export type EcosystemId = SolanaConfig.SolanaEcosystemId | EvmEcosystemId;

export const EVM_ECOSYSTEM_IDS: readonly EcosystemId[] = [
  EthereumConfig.ETHEREUM_ECOSYSTEM_ID,
  BnbConfig.BNB_ECOSYSTEM_ID,
];
export const ECOSYSTEM_IDS: readonly EcosystemId[] = [
  ...EVM_ECOSYSTEM_IDS,
  SolanaConfig.SOLANA_ECOSYSTEM_ID,
];

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case SolanaConfig.SOLANA_ECOSYSTEM_ID:
      return true;
    case EthereumConfig.ETHEREUM_ECOSYSTEM_ID:
      return true;
    case BnbConfig.BNB_ECOSYSTEM_ID:
      return true;
    // case EcosystemId.Avalanche:
    // case EcosystemId.Polygon:
    //   return true;
    // case EcosystemId.Aurora:
    //   return !!(
    //     process.env.REACT_APP_ENABLE_AURORA_USDC ||
    //     process.env.REACT_APP_ENABLE_AURORA_USDT ||
    //     process.env.REACT_APP_ENABLE_AURORA_USN
    //   );
    // case EcosystemId.Fantom:
    //   return !!process.env.REACT_APP_ENABLE_FANTOM;
    // case EcosystemId.Karura:
    //   return !!(
    //     process.env.REACT_APP_ENABLE_KARURA_USDT ||
    //     process.env.REACT_APP_ENABLE_KARURA_AUSD
    //   );
    // case EcosystemId.Acala:
    //   return !!process.env.REACT_APP_ENABLE_ACALA;
    default:
      return false;
  }
};

// export type SolanaEcosystemId = Extract<EcosystemId, EcosystemId.Solana>;

// export type EvmEcosystemId = Extract<
//   EcosystemId,
//   | EcosystemId.Ethereum
//   | EcosystemId.Bnb
//   | EcosystemId.Avalanche
//   | EcosystemId.Polygon
//   | EcosystemId.Aurora
//   | EcosystemId.Fantom
//   | EcosystemId.Karura
//   | EcosystemId.Acala
// >;

export const isEvmEcosystemId = (
  ecosystemId: EcosystemId,
): ecosystemId is EvmEcosystemId => EVM_ECOSYSTEM_IDS.includes(ecosystemId);

// export interface Ecosystem {
//   readonly id: EcosystemId;
//   readonly protocol: Protocol;
//   readonly wormholeChainId: WormholeChainId;
//   readonly displayName: string;
//   readonly logo: string;
//   readonly nativeTokenSymbol: string;
// }

const EthereumEcosystemConfig = EthereumConfig.plugin;
const BnbEcosystemConfig = BnbConfig.plugin;
const SolanaEcosystemConfig = SolanaConfig.plugin;

export const ECOSYSTEM_CONFIGS: ReadonlyMap<
  EcosystemId,
  EcosystemConfig<
    string,
    EcosystemId,
    number,
    number,
    CoreTypes.ChainConfig<EcosystemId, number>
  >
> = new Map([
  [EthereumEcosystemConfig.id, { EthereumEcosystemConfig }],
  [BnbEcosystemConfig.id, { BnbEcosystemConfig }],
  [SolanaEcosystemConfig.id, { SolanaEcosystemConfig }],
]);

// export const ECOSYSTEMS: ReadonlyRecord<EcosystemId, > =
//   Object.fromEntries(
//     ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.id, ecosystem]),
//   ) as ReadonlyRecord<EcosystemId, EcosystemConfig>;

export const getEcosystemsForProtocol = (
  protocol: string,
): readonly EcosystemId[] => {
  return filterMap(
    (ecosystemConfig: any) => ecosystemConfig.protocol === protocol,
    (ecosystemConfig) => ecosystemConfig.id,
    ECOSYSTEM_CONFIGS,
  );
};
