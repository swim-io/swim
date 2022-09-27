import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export const bnbChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 56,
  [Env.Testnet]: 97,
  [Env.Local]: 1397,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Mainnet",
  chainId: bnbChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    portal: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
  },
  publicRpcUrls: ["https://bsc-dataseed1.ninicoin.io/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Testnet",
  chainId: bnbChainId[Env.Testnet],
  wormhole: {
    bridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
    portal: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
  },
  publicRpcUrls: ["https://data-seed-prebsc-2-s2.binance.org:8545/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const localnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Localnet",
  chainId: bnbChainId[Env.Local],
  wormhole: {
    bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
    portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
  },
  publicRpcUrls: ["http://localhost:8546"],
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Binance Coin",
  symbol: "BNB",
  decimals: 18,
};

export const bnb = assertType<EvmEcosystemConfig<EvmEcosystemId.Bnb>>()({
  id: EvmEcosystemId.Bnb,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 4,
  displayName: "BNB Chain",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
