import { Env } from "@swim-io/core-types";
import type {
  EvmProtocol,
  EvmChainConfig as GenericEvmChainConfig,
  EvmEcosystemConfig as GenericEvmEcosystemConfig,
} from "@swim-io/evm-types";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import type { BnbChainId } from "@swim-io/plugin-ecosystem-bnb";
import bnbPlugin from "@swim-io/plugin-ecosystem-bnb";
import type { EthereumChainId } from "@swim-io/plugin-ecosystem-ethereum";
import ethereumPlugin from "@swim-io/plugin-ecosystem-ethereum";
import type {
  SolanaChainConfig,
  SolanaEcosystemConfig,
  SolanaProtocol,
} from "@swim-io/plugin-ecosystem-solana";
import solanaPlugin, {
  SOLANA_PROTOCOL,
  SolanaChainId,
} from "@swim-io/plugin-ecosystem-solana";

import type { ReadonlyRecord } from "../utils";
import { filterMap } from "../utils";

export type Protocol = SolanaProtocol | EvmProtocol;

export const PROTOCOL_NAMES: Record<Protocol, string> = {
  [SOLANA_PROTOCOL]: "Solana",
  [EVM_PROTOCOL]: "EVM",
};

export type SolanaEcosystemId = typeof solanaPlugin.id;
export type EvmEcosystemId = typeof ethereumPlugin.id | typeof bnbPlugin.id;
export type EcosystemId = SolanaEcosystemId | EvmEcosystemId;
export type SolanaWormholeChainId = typeof solanaPlugin.wormholeChainId;
export type EvmWormholeChainId =
  | typeof ethereumPlugin.wormholeChainId
  | typeof bnbPlugin.wormholeChainId;
export type WormholeChainId = SolanaWormholeChainId | EvmWormholeChainId;
export type EvmChainId = EthereumChainId | BnbChainId;
export type ChainId = SolanaChainId | EvmChainId;
export type EvmChainConfig = GenericEvmChainConfig<EvmEcosystemId, EvmChainId>;
export type ChainConfig = SolanaChainConfig | EvmChainConfig;
export type EvmEcosystemConfig = GenericEvmEcosystemConfig<
  EvmEcosystemId,
  EvmWormholeChainId,
  EvmChainId,
  EvmChainConfig
>;
export type EcosystemConfig = SolanaEcosystemConfig | EvmEcosystemConfig;

const SOLANA_MAINNET_RPC_URL = process.env.REACT_APP_SOLANA_MAINNET_RPC_URL;
const SOLANA_MAINNET_WS_URL = process.env.REACT_APP_SOLANA_MAINNET_WS_URL;

const evmEcosystemPlugins = [ethereumPlugin, bnbPlugin];
const ecosystemPlugins = [solanaPlugin, ...evmEcosystemPlugins];
export const EVM_ECOSYSTEM_IDS = evmEcosystemPlugins.map((plugin) => plugin.id);
export const ECOSYSTEM_IDS = ecosystemPlugins.map((plugin) => plugin.id);

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean => {
  switch (ecosystemId) {
    case solanaPlugin.id:
    case ethereumPlugin.id:
    case bnbPlugin.id:
      // case EcosystemId.Avalanche:
      // case EcosystemId.Polygon:
      // case EcosystemId.Aurora:
      // case EcosystemId.Fantom:
      // case EcosystemId.Karura:
      return true;
    // case EcosystemId.Acala:
    //   return !!process.env.REACT_APP_ENABLE_ACALA;
    default:
      return false;
  }
};

export const isEvmEcosystemId = (
  ecosystemId: EcosystemId,
): ecosystemId is EvmEcosystemId =>
  (EVM_ECOSYSTEM_IDS as readonly string[]).includes(ecosystemId);

export const ECOSYSTEM_LIST: readonly EcosystemConfig[] = [
  solanaPlugin.createEcosystemConfig(
    new Map([
      ...solanaPlugin.presetChains,
      [
        Env.Mainnet,
        {
          ...solanaPlugin.presetChains.get(Env.Mainnet)!,
          endpoint:
            SOLANA_MAINNET_RPC_URL ?? "https://solana-api.projectserum.com",
          wsEndpoint: SOLANA_MAINNET_WS_URL ?? "",
        },
      ],
      [
        Env.Local,
        {
          name: "Solana Localnet",
          ecosystemId: "solana",
          chainId: SolanaChainId.Localnet,
          wormholeBridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
          wormholeTokenBridge: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
          endpoint: "http://127.0.0.1:8899",
          wsEndpoint: "",
          tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          otterTotCollection: "", // TODO: Deploy on localnet
        },
      ],
    ]),
  ),
  ethereumPlugin.createEcosystemConfig(
    new Map([
      ...ethereumPlugin.presetChains,
      [
        Env.Local,
        {
          name: "Ethereum Localnet",
          ecosystemId: "ethereum",
          chainId: 1337 as const,
          publicRpcUrl: "http://localhost:8545",
          wormholeBridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
          wormholeTokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        },
      ],
    ]),
  ),
  bnbPlugin.createEcosystemConfig(
    new Map([
      ...bnbPlugin.presetChains,
      [
        Env.Local,
        {
          name: "BNB Chain Localnet",
          ecosystemId: "bnb",
          chainId: 1397 as const,
          publicRpcUrl: "http://localhost:8546",
          wormholeBridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
          wormholeTokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
        },
      ],
    ]),
  ),
];

export const ECOSYSTEMS: ReadonlyRecord<EvmEcosystemId, EvmEcosystemConfig> &
  ReadonlyRecord<SolanaEcosystemId, SolanaEcosystemConfig> = Object.fromEntries(
  ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.id, ecosystem]),
) as ReadonlyRecord<EvmEcosystemId, EvmEcosystemConfig> &
  ReadonlyRecord<SolanaEcosystemId, SolanaEcosystemConfig>;

export const getEcosystemsForProtocol = (
  protocol: Protocol,
): readonly EcosystemId[] => {
  return filterMap(
    (ecosystem: EcosystemConfig) => ecosystem.protocol === protocol,
    (ecosystem) => ecosystem.id,
    ECOSYSTEM_LIST,
  );
};

export const ALL_UNIQUE_CHAINS = ECOSYSTEM_LIST.reduce<{
  readonly [SOLANA_PROTOCOL]: readonly SolanaChainConfig[];
  readonly [EVM_PROTOCOL]: readonly EvmChainConfig[];
}>(
  (chains, ecosystem) => ({
    ...chains,
    [ecosystem.protocol]: [...chains[ecosystem.protocol], ...ecosystem.chains],
  }),
  {
    [SOLANA_PROTOCOL]: [],
    [EVM_PROTOCOL]: [],
  },
);
