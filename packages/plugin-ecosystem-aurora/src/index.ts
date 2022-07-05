import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

export const AURORA_ECOSYSTEM_ID = "aurora" as const;
export enum AuroraChainId {
  Mainnet = 1313161554,
  Testnet = 1313161555,
}
export const AURORA_WORMHOLE_CHAIN_ID = 9 as const;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: AURORA_ECOSYSTEM_ID,
      chainId: AuroraChainId.Mainnet,
      chainName: "Aurora Mainnet",
      rpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
      wormholeTokenBridge: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: AURORA_ECOSYSTEM_ID,
      chainId: AuroraChainId.Testnet,
      chainName: "Aurora Testnet",
      rpcUrls: ["https://testnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xBd07292de7b505a4E803CEe286184f7Acf908F5e",
      wormholeTokenBridge: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
    },
  ],
]);

export const createAuroraEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: AURORA_ECOSYSTEM_ID,
  protocol: "evm" as const,
  wormholeChainId: AURORA_WORMHOLE_CHAIN_ID,
  displayName: "Aurora",
  gasToken: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  chains,
});