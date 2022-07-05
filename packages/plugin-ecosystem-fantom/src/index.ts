import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

export const FANTOM_ECOSYSTEM_ID = "fantom" as const;
export enum FantomChainId {
  Mainnet = 250,
  Testnet = 4002,
}
export const FANTOM_WORMHOLE_CHAIN_ID = 10 as const;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
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

export const createFantomEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: FANTOM_ECOSYSTEM_ID,
  protocol: "evm" as const,
  wormholeChainId: FANTOM_WORMHOLE_CHAIN_ID,
  displayName: "Fantom",
  gasToken: {
    name: "FTM",
    symbol: "FTM",
    decimals: 18,
  },
  chains,
});