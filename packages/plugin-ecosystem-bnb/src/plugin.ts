import type { EcosystemPlugin, GasToken } from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";
import type {
  EvmChainConfig,
  EvmEcosystemConfig,
  EvmProtocol,
} from "@swim-io/evm-types";
import { createEvmEcosystemPlugin } from "@swim-io/evm-types";

export type BnbEcosystemId = "bnb";
export const BNB_ECOSYSTEM_ID: BnbEcosystemId = "bnb";

export type BnbWormholeChainId = 2;
export const BNB_WORMHOLE_CHAIN_ID: BnbWormholeChainId = 2;

export const enum BnbChainId {
  Mainnet = 56,
  Testnet = 97,
}

export type BnbChainConfig = EvmChainConfig<BnbEcosystemId, BnbChainId>;

export type BnbEcosystemConfig = EvmEcosystemConfig<
  BnbEcosystemId,
  BnbWormholeChainId,
  BnbChainId
>;

const presetChains: ReadonlyMap<Env, BnbChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      name: "BNB Chain Mainnet",
      ecosystemId: BNB_ECOSYSTEM_ID,
      env: Env.Mainnet,
      chainId: BnbChainId.Mainnet,
      wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
      wormholeTokenBridge: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
      publicRpcUrl: "https://bsc-dataseed1.ninicoin.io/", // TODO: Think about what is best to recommend to MetaMask
    },
  ],
  [
    Env.Devnet,
    {
      name: "BNB Chain Testnet",
      ecosystemId: BNB_ECOSYSTEM_ID,
      env: Env.Devnet,
      chainId: BnbChainId.Testnet,
      wormholeBridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
      wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
      publicRpcUrl: "https://data-seed-prebsc-2-s2.binance.org:8545/", // TODO: Think about what is best to recommend to MetaMask
    },
  ],
]);

const gasToken: GasToken = {
  name: "Binance Coin",
  symbol: "BNB",
  decimals: 18,
};

export const plugin: EcosystemPlugin<
  EvmProtocol,
  BnbEcosystemId,
  BnbWormholeChainId,
  BnbChainId,
  BnbChainConfig
> = createEvmEcosystemPlugin(
  BNB_ECOSYSTEM_ID,
  BNB_WORMHOLE_CHAIN_ID,
  "BNB Chain",
  gasToken,
  presetChains,
);
