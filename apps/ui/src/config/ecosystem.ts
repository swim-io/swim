import { Env } from "@swim-io/core-types";
import type {
  EvmChainConfig,
  EvmEcosystemConfig,
  EvmProtocol,
} from "@swim-io/evm-types";
import { EVM_PROTOCOL } from "@swim-io/evm-types";
import type {
  BnbChainId,
  BnbEcosystemId,
  BnbWormholeChainId,
} from "@swim-io/plugin-ecosystem-bnb";
import bnbPlugin from "@swim-io/plugin-ecosystem-bnb";
import type {
  EthereumChainId,
  EthereumEcosystemId,
  EthereumWormholeChainId,
} from "@swim-io/plugin-ecosystem-ethereum";
import ethereumPlugin from "@swim-io/plugin-ecosystem-ethereum";
import type {
  SolanaChainConfig,
  SolanaEcosystemConfig,
  SolanaEcosystemId,
  SolanaProtocol,
  SolanaWormholeChainId,
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

export type { SolanaEcosystemId } from "@swim-io/plugin-ecosystem-solana";
export type EvmEcosystemId = EthereumEcosystemId | BnbEcosystemId;
export type EcosystemId = SolanaEcosystemId | EvmEcosystemId;
export type EvmWormholeChainId = EthereumWormholeChainId | BnbWormholeChainId;
export type WormholeChainId = SolanaWormholeChainId | EvmWormholeChainId;
export type EvmChainId = EthereumChainId | BnbChainId;
export type ChainId = SolanaChainId | EvmChainId;
export type UiEvmEcosystemConfig = EvmEcosystemConfig<
  EvmEcosystemId,
  EvmWormholeChainId,
  EvmChainId,
  EvmChainConfig<EvmEcosystemId, EvmChainId>
>;
export type UiEcosystemConfig = SolanaEcosystemConfig | UiEvmEcosystemConfig;

const SOLANA_MAINNET_RPC_URL = process.env.REACT_APP_SOLANA_MAINNET_RPC_URL;
const SOLANA_MAINNET_WS_URL = process.env.REACT_APP_SOLANA_MAINNET_WS_URL;

const evmEcosystemPlugins = [ethereumPlugin, bnbPlugin];
const ecosystemPlugins = [solanaPlugin, ...evmEcosystemPlugins];
export const EVM_ECOSYSTEM_IDS = evmEcosystemPlugins.map((plugin) => plugin.id);
export const ECOSYSTEM_IDS = ecosystemPlugins.map((plugin) => plugin.id);

export const isEcosystemEnabled = (ecosystemId: EcosystemId): boolean =>
  ECOSYSTEM_IDS.includes(ecosystemId);

export const isEvmEcosystemId = (
  ecosystemId: EcosystemId,
): ecosystemId is EvmEcosystemId =>
  (EVM_ECOSYSTEM_IDS as readonly string[]).includes(ecosystemId);

export const ECOSYSTEM_LIST: readonly UiEcosystemConfig[] = [
  solanaPlugin.createEcosystemConfig([
    {
      ...solanaPlugin.presetChains.get(Env.Mainnet)!,
      endpoint: SOLANA_MAINNET_RPC_URL ?? "https://solana-api.projectserum.com",
      wsEndpoint: SOLANA_MAINNET_WS_URL ?? "",
    },
    solanaPlugin.presetChains.get(Env.Devnet)!,
    {
      env: Env.Local,
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
  ]),
  ethereumPlugin.createEcosystemConfig([
    ethereumPlugin.presetChains.get(Env.Mainnet)!,
    ethereumPlugin.presetChains.get(Env.Devnet)!,
    {
      env: Env.Local,
      name: "Ethereum Localnet",
      ecosystemId: "ethereum",
      chainId: 1337 as const,
      publicRpcUrl: "http://localhost:8545",
      wormholeBridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
      wormholeTokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
    },
  ]),
  bnbPlugin.createEcosystemConfig([
    bnbPlugin.presetChains.get(Env.Mainnet)!,
    bnbPlugin.presetChains.get(Env.Devnet)!,
    {
      env: Env.Local,
      name: "BNB Chain Localnet",
      ecosystemId: "bnb",
      chainId: 1397 as const,
      publicRpcUrl: "http://localhost:8546",
      wormholeBridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
      wormholeTokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
    },
  ]),
];

export const ECOSYSTEMS: ReadonlyRecord<
  EvmEcosystemId,
  EvmEcosystemConfig<EvmEcosystemId, EvmWormholeChainId, EvmChainId>
> &
  ReadonlyRecord<SolanaEcosystemId, SolanaEcosystemConfig> = Object.fromEntries(
  ECOSYSTEM_LIST.map((ecosystem) => [ecosystem.id, ecosystem]),
) as ReadonlyRecord<
  EvmEcosystemId,
  EvmEcosystemConfig<EvmEcosystemId, EvmWormholeChainId, EvmChainId>
> &
  ReadonlyRecord<SolanaEcosystemId, SolanaEcosystemConfig>;

export const getEcosystemsForProtocol = (
  protocol: Protocol,
): readonly EcosystemId[] => {
  return filterMap(
    (ecosystem: UiEcosystemConfig) => ecosystem.protocol === protocol,
    (ecosystem) => ecosystem.id,
    ECOSYSTEM_LIST,
  );
};

export const ALL_UNIQUE_CHAINS = ECOSYSTEM_LIST.reduce<{
  readonly [SOLANA_PROTOCOL]: readonly SolanaChainConfig[];
  readonly [EVM_PROTOCOL]: readonly EvmChainConfig<
    EvmEcosystemId,
    EvmChainId
  >[];
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
