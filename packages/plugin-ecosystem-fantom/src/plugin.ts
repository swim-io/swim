import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-types';
import { createEvmEcosystemConfigPlugin } from '@swim-io/evm-types';
import { Env } from "@swim-io/core-types";

export type FantomEcosystemId = "fantom";
export const FANTOM_ECOSYSTEM_ID: FantomEcosystemId = "fantom";

export type FantomWormholeChainId = 10;
export const FANTOM_WORMHOLE_CHAIN_ID: FantomWormholeChainId = 10;

export const enum FantomChainId {
  Mainnet = 250,
  Testnet = 4002,
}

export type FantomChainConfig = EvmChainConfig<FantomEcosystemId, FantomChainId>;

export type FantomEcosystemConfig = EvmEcosystemConfig<
  FantomEcosystemId,
  FantomWormholeChainId,
  FantomChainId
>;

export const PRESETS: ReadonlyMap<Env, FantomChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: FANTOM_ECOSYSTEM_ID,
      chainId: FantomChainId.Mainnet,
      chainName: "Fantom Mainnet",
      rpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
      wormholeTokenBridge: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: FANTOM_ECOSYSTEM_ID,
      chainId: FantomChainId.Testnet,
      chainName: "Fantom Testnet",
      rpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
      wormholeTokenBridge: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
    },
  ],
]);

export const createFantomEcosystemConfig = createEvmEcosystemConfigPlugin(
  FANTOM_ECOSYSTEM_ID,
  FANTOM_WORMHOLE_CHAIN_ID,
  {
    name: "FTM",
    symbol: "FTM",
    decimals: 18,
  },
);
