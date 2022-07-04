import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const AuroraEcosystemId = "aurora";
const AuroraMainnetChainId = 1313161554;
const AuroraTestnetChainId = 1313161555;
const AuroraWormholeChainId = 9;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: AuroraEcosystemId,
      chainId: AuroraMainnetChainId,
      chainName: "Aurora Mainnet",
      rpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
      wormholeTokenBridge: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: AuroraEcosystemId,
      chainId: AuroraTestnetChainId,
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
  id: AuroraEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: AuroraWormholeChainId,
  displayName: "Aurora",
  gasToken: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  chains,
});