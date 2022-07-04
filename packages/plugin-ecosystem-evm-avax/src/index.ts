import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const AvalancheEcosystemId = "avalanche";
const AvalancheMainnetChainId = 43114;
const AvalancheTestnetChainId = 43113;
const AvalancheWormholeChainId = 6;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: AvalancheEcosystemId,
      chainId: AvalancheMainnetChainId,
      chainName: "Avalanche Mainnet",
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
      wormholeTokenBridge: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: AvalancheEcosystemId,
      chainId: AvalancheTestnetChainId,
      chainName: "Avalanche Testnet",
      rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], // TODO: Replace/refactor
      wormholeBridge: "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C",
      wormholeTokenBridge: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
    },
  ],
]);

export const createAvalancheEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: AvalancheEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: AvalancheWormholeChainId,
  displayName: "Avalanche",
  gasToken: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  chains,
});