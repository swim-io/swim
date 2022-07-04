import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const KaruraEcosystemId = "karura";
const KaruraMainnetChainId = 686;
const KaruraTestnetChainId = 596;
const KaruraWormholeChainId = 11;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: KaruraEcosystemId,
      chainId: KaruraMainnetChainId,
      chainName: "Karura Mainnet",
      rpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
      wormholeTokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: KaruraEcosystemId,
      chainId: KaruraTestnetChainId,
      chainName: "Karura Testnet",
      rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
      wormholeTokenBridge: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
    },
  ],
]);

export const createKaruraEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: KaruraEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: KaruraWormholeChainId,
  displayName: "Karura",
  gasToken: {
    name: "Karura",
    symbol: "KAR",
    decimals: 18,
  },
  chains,
});