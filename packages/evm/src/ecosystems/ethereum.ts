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

export const ethereumChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 1,
  [Env.Testnet]: 5,
  [Env.Local]: 1337,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Mainnet",
  chainId: ethereumChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    portal: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
  },
  publicRpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "0x01F369bF2d5a62CE60B0a2E92143CD623BeCb0fB", // TODO: Update when deployed
    decimals: 8, // TODO: Confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-ethereum-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
      },
    },
    {
      id: "mainnet-ethereum-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        decimals: 6,
      },
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Görli Testnet",
  chainId: ethereumChainId[Env.Testnet],
  wormhole: {
    bridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
    portal: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  },
  publicRpcUrls: ["https://goerli.prylabs.net/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "0x4873edbb0B4b5b48A6FBe50CacB85e58D0b62ab5", // TODO: Update if necessary
    decimals: 6,
  },
  routingContractAddress: "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4", // TODO: Update if necessary
  tokens: [
    {
      id: "testnet-ethereum-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
        decimals: 6,
      },
    },
    {
      id: "testnet-ethereum-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
        decimals: 6,
      },
    },
    {
      id: "testnet-ethereum-lp-usdc-usdt",
      projectId: TokenProjectId.SwimLpEthereumUsdcUsdt,
      nativeDetails: {
        address: "0xf3eb1180A64827A602A7e02883b7299191527073", // TODO: Update
        decimals: 6,
      },
    },
  ],
  pools: [],
};

const localnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Localnet",
  chainId: ethereumChainId[Env.Local],
  wormhole: {
    bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
    portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
  },
  publicRpcUrls: ["http://localhost:8545"],
  swimUsdDetails: {
    address: "0x56cd8686e818c0C29983eA32fa6938618b35923f", // TODO: Update when deployed
    decimals: 8, // TODO: Confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "local-ethereum-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
        decimals: 6,
      },
    },
    {
      id: "local-ethereum-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0xdAA71FBBA28C946258DD3d5FcC9001401f72270F",
        decimals: 6,
      },
    },
  ],
  pools: [],
};

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const ethereum = assertType<
  EvmEcosystemConfig<EvmEcosystemId.Ethereum>
>()({
  id: EvmEcosystemId.Ethereum,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 2,
  displayName: "Ethereum",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
