import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { avalanche as avalancheFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Avalanche> = {
  ...avalancheFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-avalanche-usdc",
      projectId: TokenProjectIdV1.Usdc,
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
      projectId: TokenProjectIdV1.Usdt,
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

const testnet: EvmChainConfigV1<EvmEcosystemId.Avalanche> = {
  ...avalancheFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-avalanche-usdc",
      projectId: TokenProjectIdV1.Usdc,
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
      projectId: TokenProjectIdV1.Usdt,
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
      projectId: TokenProjectIdV2.SwimLpAvalancheUsdcUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const avalanche = assertType<
  EvmEcosystemConfigV1<EvmEcosystemId.Avalanche>
>()({
  ...avalancheFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
