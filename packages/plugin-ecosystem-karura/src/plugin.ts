import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-types';
import { createEvmEcosystemConfigPlugin } from '@swim-io/evm-types';
import { Env } from "@swim-io/core-types";

export type KaruraEcosystemId = "karura";
export const KARURA_ECOSYSTEM_ID: KaruraEcosystemId = "karura";

export type KaruraWormholeChainId = 11;
export const KARURA_WORMHOLE_CHAIN_ID: KaruraWormholeChainId = 11;

export const enum KaruraChainId {
  Mainnet = 686,
  Testnet = 596,
}

export type KaruraChainConfig = EvmChainConfig<KaruraEcosystemId, KaruraChainId>;

export type KaruraEcosystemConfig = EvmEcosystemConfig<
  KaruraEcosystemId,
  KaruraWormholeChainId,
  KaruraChainId
>;

export const PRESETS: ReadonlyMap<Env, KaruraChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: KARURA_ECOSYSTEM_ID,
      chainId: KaruraChainId.Mainnet,
      chainName: "Karura Mainnet",
      rpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
      wormholeTokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: KARURA_ECOSYSTEM_ID,
      chainId: KaruraChainId.Testnet,
      chainName: "Karura Testnet",
      rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
      wormholeTokenBridge: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
    },
  ],
]);

export const createKaruraEcosystemConfig = createEvmEcosystemConfigPlugin(
  KARURA_ECOSYSTEM_ID,
  KARURA_WORMHOLE_CHAIN_ID,
  {
    name: "Karura",
    symbol: "KAR",
    decimals: 18,
  },
);
