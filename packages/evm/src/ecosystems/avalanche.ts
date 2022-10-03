import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

const SOLANA_ECOSYSTEM_ID = "solana";

export const avalancheChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 43114, // C-Chain
  [Env.Testnet]: 43113,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Avalanche> = {
  name: "Avalanche Mainnet",
  chainId: avalancheChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
    portal: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
  },
  publicRpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-avalanche-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "FHfba3ov5P3RjaiLVgh8FTv4oirxQDoVXuoUUDvHuXax",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-avalanche-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "Kz1csQA91WUGcQ2TB3o5kdGmWmMGp8eJcDEyHzNDVCX",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Avalanche> = {
  name: "Avalanche Testnet",
  chainId: avalancheChainId[Env.Testnet],
  wormhole: {
    bridge: "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C",
    portal: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
  },
  publicRpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Avalanche",
  symbol: "AVAX",
  decimals: 18,
};

export const avalanche = assertType<
  EvmEcosystemConfig<EvmEcosystemId.Avalanche>
>()({
  id: EvmEcosystemId.Avalanche,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 6,
  displayName: "Avalanche",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
