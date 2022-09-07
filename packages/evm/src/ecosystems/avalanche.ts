import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainId,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export const avalancheChainId = assertType<EvmChainId>()({
  [Env.Mainnet]: 43114, // C-Chain
  [Env.Devnet]: 43113,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Avalanche> = {
  name: "Avalanche Mainnet",
  chainId: avalancheChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
    portal: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
  },
  publicRpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Avalanche> = {
  name: "Avalanche Testnet",
  chainId: avalancheChainId[Env.Devnet],
  wormhole: {
    bridge: "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C",
    portal: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
  },
  publicRpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<
  Env,
  EvmChainConfig<EvmEcosystemId.Avalanche>
> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
]);

const gasToken: GasToken = {
  name: "Avalanche",
  symbol: "AVAX",
  decimals: 18,
};

export const avalanche: EvmEcosystemConfig<EvmEcosystemId.Avalanche> = {
  id: EvmEcosystemId.Avalanche,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 6,
  displayName: "Avalanche",
  gasToken,
  chains,
};
