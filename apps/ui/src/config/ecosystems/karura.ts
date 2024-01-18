import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { karura as karuraFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Karura> = {
  ...karuraFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-karura-ausd",
      projectId: TokenProjectIdV1.Ausd,
      nativeDetails: {
        address: "0x0000000000000000000100000000000000000081",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "3sEvyXzC2vAPqF7uprB2vRaL1X1FbqQqmPxhwVi53GYF",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-karura-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x0000000000000000000500000000000000000007",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "E942z7FnS7GpswTvF5Vggvo7cMTbvZojjLbFgsrDVff1",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Karura> = {
  ...karuraFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-karura-ausd",
      projectId: TokenProjectIdV1.Ausd,
      nativeDetails: {
        address: "0x074370ca8Fea9e8f1C5eE23f34CBdcD3FB7a66aD",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "BRpsJtEUyCPQPRP4DAavXU5KmBqfgKQmX7fwnpVvUUMG",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-karura-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x535d5e3b1ff7de526fe180e654a41350903c328d",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "AnYj8Rbkfd8FYmoiyv6iDS3Tje7PzhPWyE5VZVDh9pzD",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-karura-lp-usdt",
      projectId: TokenProjectIdV2.SwimLpKaruraUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
    {
      id: "testnet-karura-lp-ausd",
      projectId: TokenProjectIdV2.SwimLpKaruraAusd,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const karura = assertType<EvmEcosystemConfigV1<EvmEcosystemId.Karura>>()(
  {
    ...karuraFromSdk,
    chains: {
      [Env.Mainnet]: mainnet,
      [Env.Testnet]: testnet,
    },
  } as const,
);
