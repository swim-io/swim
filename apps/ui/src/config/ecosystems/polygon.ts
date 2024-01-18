import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { polygon as polygonFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Polygon> = {
  ...polygonFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-polygon-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-polygon-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "5goWRao6a3yNC4d6UjMdQxonkCMvKBwdpubU3qhfcdf1",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Polygon> = {
  ...polygonFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-polygon-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x0a0d7cEA57faCBf5DBD0D3b5169Ab00AC8Cf7dd1",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "D5YvMW5U3HUpD1EstYbKmmZsLdmCPgUj44JqBmNY7fUM",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-polygon-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x2Ac9183EC64F71AfB73909c7C028Db14d35FAD2F",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "2otzQWyoydNp4Ws1kV8J8WVYiun6wmuFMMbicgdoEULn",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-polygon-lp-usdc-usdt",
      projectId: TokenProjectIdV2.SwimLpPolygonUsdcUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const polygon = assertType<
  EvmEcosystemConfigV1<EvmEcosystemId.Polygon>
>()({
  ...polygonFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
