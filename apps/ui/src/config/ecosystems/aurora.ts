import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { aurora as auroraFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Aurora> = {
  ...auroraFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-aurora-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0xB12BFcA5A55806AaF64E99521918A4bf0fC40802",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "9Y8pJhF8AQGBGL5PTd12P4w82n2qAADTmWakkXSatdAu",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-aurora-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x4988a896b1227218e4A686fdE5EabdcAbd91571f",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "GFhej2oJ1NPLbzSX3D3B9jzYaidff6NoBAUNmu6dLXwU",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Aurora> = {
  ...auroraFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-aurora-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "B3qmqCvzbni27z5TRrt1uBYMczUCjCjui7piGAZifSTU",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-aurora-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x489dDcd070b6c4e0373FBB5d529Cc06328E048c3",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "BaTEf2Mnrf9wePKb9g9BtSPkrZmmBnR6K9Q1ZxDKmWoh",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "testnet-aurora-lp-usdc-usdt",
      projectId: TokenProjectIdV2.SwimLpAuroraUsdcUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

export const aurora = assertType<EvmEcosystemConfigV1<EvmEcosystemId.Aurora>>()(
  {
    ...auroraFromSdk,
    chains: {
      [Env.Mainnet]: mainnet,
      [Env.Testnet]: testnet,
    },
  } as const,
);
