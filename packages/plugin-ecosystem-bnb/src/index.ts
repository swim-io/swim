import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const BnbEcosystemId = "bsc";
const BnbMainnetChainId = 56;
const BnbTestnetChainId = 97;
const BnbWormholeChainId = 4;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: BnbEcosystemId,
      chainId: BnbMainnetChainId,
      chainName: "BNB Chain Mainnet",
      rpcUrls: ["https://bsc-dataseed1.ninicoin.io"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
      wormholeTokenBridge: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: BnbEcosystemId,
      chainId: BnbTestnetChainId,
      chainName: "BNB Chain Testnet",
      rpcUrls: ["https://data-seed-prebsc-2-s2.binance.org:8545"],
      wormholeBridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
      wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
    },
  ],
]);

export const createBnbEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: BnbEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: BnbWormholeChainId,
  displayName: "BNB",
  gasToken: {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
  },
  chains,
});