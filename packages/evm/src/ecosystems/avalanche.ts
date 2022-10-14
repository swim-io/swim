import type { GasToken, TokenDetails } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

const EMPTY_MAP: ReadonlyMap<string, TokenDetails> = new Map();
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
    address: "0x5eDEa6B0881425AE4Aa7c65aCa6AeaFecC7E72f5", // TODO: Update if necessary
    decimals: 6,
  },
  routingContractAddress: "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4", // TODO: Update if necessary
  tokens: [
    {
      id: "testnet-avalanche-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-avalanche-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x489dDcd070b6c4e0373FBB5d529Cc06328E048c3",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "9ibet2CuBX1a4HpbzH9auxxtyUvkSKVy39jWtZY5Bfor",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-avalanche-lp-usdc-usdt",
      projectId: TokenProjectId.SwimLpAvalancheUsdcUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
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
