import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const FantomEcosystemId = "fantom";
const FantomMainnetChainId = 250;
const FantomTestnetChainId = 4002;
const FantomWormholeChainId = 10;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: FantomEcosystemId,
      chainId: FantomMainnetChainId,
      chainName: "Fantom Mainnet",
      rpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
      wormholeTokenBridge: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: FantomEcosystemId,
      chainId: FantomTestnetChainId,
      chainName: "Fantom Testnet",
      rpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
      wormholeTokenBridge: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
    },
  ],
]);

export const createFantomEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: FantomEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: FantomWormholeChainId,
  displayName: "Fantom",
  gasToken: {
    name: "FTM",
    symbol: "FTM",
    decimals: 18,
  },
  chains,
});