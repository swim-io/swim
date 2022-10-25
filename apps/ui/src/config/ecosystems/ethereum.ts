import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { ethereum as ethereumFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Ethereum> = {
  ...ethereumFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-ethereum-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-ethereum-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Ethereum> = {
  ...ethereumFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-ethereum-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-ethereum-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "8Cfyi1mYXqKATUkMPvb9BMXikdbppJst6E7eQJkKjAtf",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-ethereum-lp-usdc-usdt",
      projectId: TokenProjectIdV2.SwimLpEthereumUsdcUsdt,
      nativeDetails: {
        address: "0xf3eb1180A64827A602A7e02883b7299191527073", // TODO: Update
        decimals: 6,
      },
    },
  ],
  pools: [],
};

const localnet: EvmChainConfigV1<EvmEcosystemId.Ethereum> = {
  ...ethereumFromSdk.chains[Env.Local],
  tokens: [
    {
      id: "local-ethereum-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "local-ethereum-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0xdAA71FBBA28C946258DD3d5FcC9001401f72270F",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

export const ethereum = assertType<
  EvmEcosystemConfigV1<EvmEcosystemId.Ethereum>
>()({
  ...ethereumFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
