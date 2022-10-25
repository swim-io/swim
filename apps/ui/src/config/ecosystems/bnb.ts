import { Env } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { bnb as bnbFromSdk } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import { TokenProjectIdV1 } from "../tokenProjects";

import type { EvmChainConfigV1, EvmEcosystemConfigV1 } from "./types";

const mainnet: EvmChainConfigV1<EvmEcosystemId.Bnb> = {
  ...bnbFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-bnb-busd",
      projectId: TokenProjectIdV1.Busd,
      nativeDetails: {
        address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x55d398326f99059ff775485246999027b3197955",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-gst",
      projectId: TokenProjectIdV1.Gst,
      nativeDetails: {
        address: "0x4a2c860cec6471b9f5f5a336eb4f38bb21683c98",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "GDuUFXEhUm4jG71vPxYRX3VxUMJ5etGvHTR1iKwTdb6p",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-gmt",
      projectId: TokenProjectIdV1.Gmt,
      nativeDetails: {
        address: "0x3019bf2a2ef8040c242c9a4c5c4bd4c81678b2a1",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "7dzFD8xQ3FDmVLxwn75UA9WhVnBsUdRAexASVvpXX3Bo",
            decimals: 8,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfigV1<EvmEcosystemId.Bnb> = {
  ...bnbFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-bnb-busd",
      projectId: TokenProjectIdV1.Busd,
      nativeDetails: {
        address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "6KTvgrkLoPJdB3Grv4ZBUGt6JiLdVnKzJNo4HvLEgm6d",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-bnb-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x98529E942FD121d9C470c3d4431A008257E0E714",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "4dr6ogcLsaFf2RDF4LJU1CvNtNKxonVqQvM6vuGdVR1e",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-bnb-gst",
      projectId: TokenProjectIdV1.Gst,
      nativeDetails: {
        address: "0x73160078948280B8680e5F1eB2964698928E8cd7",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "6oAiihJq1urtb6P8ARjwA6TFoduSoVGxaMb8gEMm5cR6",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-bnb-gmt",
      projectId: TokenProjectIdV1.Gmt,
      nativeDetails: {
        address: "0x1F65D61D01E3f10b34B855287b32D7bfbEA088D0",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "GE2tiQBCoPjCABkoTXa9jTSV8zCVZo8shyiBh8v52hDz",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-bnb-lp-busd-usdt",
      projectId: TokenProjectIdV2.SwimLpBnbBusdUsdt,
      nativeDetails: {
        address: "0x57FCF9B276d3E7D698112D9b87e6f410B1B5d78d", // TODO: Update
        decimals: 6,
      },
    },
  ],
  pools: [],
};

const localnet: EvmChainConfigV1<EvmEcosystemId.Bnb> = {
  ...bnbFromSdk.chains[Env.Local],
  tokens: [
    {
      id: "local-bnb-busd",
      projectId: TokenProjectIdV1.Busd,
      nativeDetails: {
        address: "0xCeeFD27e0542aFA926B87d23936c79c276A48277",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "local-bnb-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "0x988B6CFBf3332FF98FFBdED665b1F53a61f92612",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
            decimals: 8,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

export const bnb = assertType<EvmEcosystemConfigV1<EvmEcosystemId.Bnb>>()({
  ...bnbFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
