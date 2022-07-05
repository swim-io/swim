import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

export const BNB_ECOSYSTEM_ID = "bsc" as const;
export enum BnbChainId {
  Mainnet = 56,
  Testnet = 97,
}
export const BNB_WORMHOLE_CHAIN_ID = 4 as const;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: BNB_ECOSYSTEM_ID,
      chainId: BnbChainId.Mainnet,
      chainName: "BNB Chain Mainnet",
      rpcUrls: ["https://bsc-dataseed1.ninicoin.io"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
      wormholeTokenBridge: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: BNB_ECOSYSTEM_ID,
      chainId: BnbChainId.Testnet,
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
  id: BNB_ECOSYSTEM_ID,
  protocol: "evm" as const,
  wormholeChainId: BNB_WORMHOLE_CHAIN_ID,
  displayName: "BNB",
  gasToken: {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18,
  },
  chains,
});