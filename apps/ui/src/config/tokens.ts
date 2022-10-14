import { Env } from "@swim-io/core";
import type {
  TokenConfig as CoreTokenConfig,
  TokenDetails,
} from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EcosystemId } from "./ecosystem";
import { isEcosystemEnabled } from "./ecosystem";
import { isPoolRestructureEnabled } from "./pools";

export interface TokenConfig extends CoreTokenConfig {
  readonly isDisabled?: boolean;
  // TODO: Remove and derive from ChainConfig
  readonly nativeEcosystemId: EcosystemId;
  /** Required for v1 pool support */
  readonly wrappedDetails: ReadonlyMap<EcosystemId, TokenDetails>;
}

// NOTE: Use a shared empty map to save memory
const EMPTY_MAP: TokenConfig["wrappedDetails"] = new Map();

const MAINNET_TOKENS: readonly TokenConfig[] = [
  {
    id: "mainnet-solana-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x41f7B8b9b897276b7AAE926a9016935280b44E97",
          decimals: 6,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x91Ca579B0D47E5cfD5D0862c21D5659d39C8eCf0",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-usdt",
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C",
          decimals: 6,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x49d5cC521F75e13fa8eb4E89E9D381352C897c96",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-gst",
    projectId: TokenProjectId.Gst,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-gmt",
    projectId: TokenProjectId.Gmt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-hexapool",
    projectId: TokenProjectId.SwimUsd,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
      decimals: 8,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x01F369bF2d5a62CE60B0a2E92143CD623BeCb0fB",
          decimals: 8,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0xF78479d516A12b9cFb000951D19f67B4fE0B065d",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-meta-avalanche-usdc",
    projectId: TokenProjectId.SwimAvalancheUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "DKwsWeqHrB8R1u2DFMHKtq4iqaQNgPgUbHTJyXPqkTzK",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-avalanche-usdt",
    projectId: TokenProjectId.SwimAvalancheUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "5rwvDmUbcnZTwZ4Zywev2wnDbyDDD2vcsGU2Xmy7aRNS",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-polygon-usdc",
    projectId: TokenProjectId.SwimPolygonUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "ANFojEXhiEQQoovhBs77XmBQuqbe59UBygRWViyf4945",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-polygon-usdt",
    projectId: TokenProjectId.SwimPolygonUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "2Nx6L79dHHgHcJtNfZWukQkWZvf5h4bps34zuh1gjtdP",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-gst",
    projectId: TokenProjectId.SwimSolanaGstBinanceGstLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "8YYBkTNhpY9mFdCdZWM6mHNf8J6A9hGfimb33LEiiZ3x",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-gmt",
    projectId: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "2x7MjgopLXd3qETGLpY19cyZjHvVnGkrwVjTkJnBza4A",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-aurora-usdc",
    projectId: TokenProjectId.SwimAuroraUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "9qRe2nBrR2rTXxRaV1PZN9hZnqq3UXgoFWTbP6NE3MEu",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-aurora-usdt",
    projectId: TokenProjectId.SwimAuroraUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "4XPDxtGbcM7bAPKZxALd2s862n3WoG4xPPvyCPVULKAb",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !process.env.REACT_APP_ENABLE_AURORA_USN,
    id: "mainnet-solana-lp-meta-aurora-usn",
    projectId: TokenProjectId.SwimAuroraUsnLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "3eXCU7YoiCq3rZ6787pPFJE7TXBsKuTZ49wH2kFnuTeF",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-fantom-usdc",
    projectId: TokenProjectId.SwimFantomUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "J5ifGexAQTg76TresJhJSqTPJLT6BNxrV5rwNJTTz4Cx",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !process.env.REACT_APP_ENABLE_KARURA_AUSD,
    id: "mainnet-solana-lp-meta-karura-ausd",
    projectId: TokenProjectId.SwimKaruraAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "8vzXSNVAX4fymEFahJFh1ypzDBFv3QMVaZ4GtJWHrRjU",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-solana-lp-meta-karura-usdt",
    projectId: TokenProjectId.SwimKaruraUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "2sXvitirRSjgTTNzGNWAFZWSqEx87kDoTJvqG9JSyivh",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Acala),
    id: "mainnet-solana-lp-meta-acala-ausd",
    projectId: TokenProjectId.SwimAcalaAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "11111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "mainnet-ethereum-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
  {
    id: "mainnet-bnb-busd",
    projectId: TokenProjectId.Busd,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Gst,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Gmt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
  {
    id: "mainnet-avalanche-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Avalanche,
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
    nativeEcosystemId: EvmEcosystemId.Avalanche,
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
  {
    id: "mainnet-polygon-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Polygon,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Polygon,
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
  {
    id: "mainnet-aurora-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Aurora,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Aurora,
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
  {
    isDisabled: !process.env.REACT_APP_ENABLE_AURORA_USN,
    id: "mainnet-aurora-usn",
    projectId: TokenProjectId.Usn,
    nativeEcosystemId: EvmEcosystemId.Aurora,
    nativeDetails: {
      address: "0x5183e1B1091804BC2602586919E6880ac1cf2896",
      decimals: 18,
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "3NDmtc2xKMpm8wCiaALey2y3EGhBkUNuXJ9m3JcjnHMM",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-fantom-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Fantom,
    nativeDetails: {
      address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "Dnr8fDaswHtYMSKbtR9e8D5EadyxqyJwE98xp17ZxE2E",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    isDisabled: !process.env.REACT_APP_ENABLE_KARURA_AUSD,
    id: "mainnet-karura-ausd",
    projectId: TokenProjectId.Ausd,
    nativeEcosystemId: EvmEcosystemId.Karura,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Karura,
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
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Acala),
    id: "mainnet-acala-ausd",
    projectId: TokenProjectId.Ausd,
    nativeEcosystemId: EvmEcosystemId.Acala,
    nativeDetails: {
      address: "0x0000000000000000000000000000000000000000", // TODO: Update
      decimals: 6, // TODO: Update
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "11111111111111111111111111111112", // TODO: Update
          decimals: 6, // TODO: Update
        },
      ],
    ]),
  },
  {
    isDisabled: true,
    id: "mainnet-solana-swim",
    projectId: TokenProjectId.Swim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: true,
    id: "mainnet-solana-lp-swimlake",
    projectId: TokenProjectId.XSwim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "SwiMNJ49SxkqMaVWLGGVRH25kE5dBnD2RQoiQUnKtMC",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
].filter((spec) => !spec.isDisabled);

export const TESTNET_SWIMUSD: TokenConfig = {
  isDisabled: !isPoolRestructureEnabled(),
  id: "testnet-swimusd",
  projectId: TokenProjectId.SwimLpSolanaUsdcUsdt,
  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
  nativeDetails: {
    address: "3ngTtoyP9GFybFifX1dr7gCFXFiM2Wr6NfXn6EuU7k6C", // TODO: Update
    decimals: 6,
  },
  wrappedDetails: new Map([
    [
      EvmEcosystemId.Acala,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Aurora,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Avalanche,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Bnb,
      {
        address: "0x4c15919a4354b4416e7afcb9a27a118bc45818c0", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Ethereum,
      {
        address: "0x4873edbb0B4b5b48A6FBe50CacB85e58D0b62ab5", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Fantom,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Karura,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
    [
      EvmEcosystemId.Polygon,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 6,
      },
    ],
  ]),
};

export const TESTNET_TOKENS_FOR_RESTRUCTURE: readonly TokenConfig[] = [
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-ethereum-lp-usdc-usdt",
    projectId: TokenProjectId.SwimLpEthereumUsdcUsdt,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
    nativeDetails: {
      address: "0xee525c4cEB776D9e770D2Fd81fc91d6418657955", // TODO: Update
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-bnb-lp-busd-usdt",
    projectId: TokenProjectId.SwimLpBnbBusdUsdt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
    nativeDetails: {
      address: "0x976943205ef791A1cf676A880c07458C91F241d7", // TODO: Update
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-avalanche-lp-usdc-usdt",
    projectId: TokenProjectId.SwimLpAvalancheUsdcUsdt,
    nativeEcosystemId: EvmEcosystemId.Avalanche,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-polygon-lp-usdc-usdt",
    projectId: TokenProjectId.SwimLpPolygonUsdcUsdt,
    nativeEcosystemId: EvmEcosystemId.Polygon,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-aurora-lp-usdc-usdt",
    projectId: TokenProjectId.SwimLpAuroraUsdcUsdt,
    nativeEcosystemId: EvmEcosystemId.Aurora,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled:
      !isPoolRestructureEnabled() || !process.env.REACT_APP_ENABLE_AURORA_USN,
    id: "testnet-aurora-lp-usn",
    projectId: TokenProjectId.SwimLpAuroraUsn,
    nativeEcosystemId: EvmEcosystemId.Aurora,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-fantom-lp-usdc",
    projectId: TokenProjectId.SwimLpFantomUsdc,
    nativeEcosystemId: EvmEcosystemId.Fantom,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-karura-lp-usdt",
    projectId: TokenProjectId.SwimLpKaruraUsdt,
    nativeEcosystemId: EvmEcosystemId.Karura,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled:
      !isPoolRestructureEnabled() || !process.env.REACT_APP_ENABLE_KARURA_AUSD,
    id: "testnet-karura-lp-ausd",
    projectId: TokenProjectId.SwimLpKaruraAusd,
    nativeEcosystemId: EvmEcosystemId.Karura,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "testnet-acala-lp-ausd",
    projectId: TokenProjectId.SwimLpAcalaAusd,
    nativeEcosystemId: EvmEcosystemId.Acala,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
];

export const TESTNET_TOKENS: readonly TokenConfig[] = [
  {
    id: "testnet-solana-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "2w7wsGofEAvLiWXZgJySXZ4gofEhm8jQ9rtwXr1zbzUc",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-usdt",
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "DznJzVAjPHBvyyqXEQgPWTonF2nhwoSoutPNbXjmsUvY",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-usdc-v2",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "6iSRgpK4oiqJZuhpLsTecW3n9xBKUq9N3VPQN7RinYwq",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-usdt-v2",
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "8VbikoRxEoyYzTDzDcPTSsGk2E5mM7fK1WrVpKrVd75M",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-gst",
    projectId: TokenProjectId.Gst,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-gmt",
    projectId: TokenProjectId.Gmt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-hexapool",
    projectId: TokenProjectId.SwimUsd,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
      decimals: 8,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x4DF39C514Eb1747bb4D89cA9Ee35718611590935",
          decimals: 8,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "testnet-solana-swim",
    projectId: TokenProjectId.Swim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-swimlake",
    projectId: TokenProjectId.XSwim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-avalanche-usdc",
    projectId: TokenProjectId.SwimAvalancheUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-avalanche-usdt",
    projectId: TokenProjectId.SwimAvalancheUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "D6PuZckpEcBhVcpfgjgbWnARhFD3ApHhvnxBGWR6MW5Z",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-polygon-usdc",
    projectId: TokenProjectId.SwimPolygonUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "6WBFbyA3XJ3T2BeqA9JbyZFfj3KTCRtnC8MJANBsVNrz",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-polygon-usdt",
    projectId: TokenProjectId.SwimPolygonUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "HH3RwS94BWhR4bKeNYGvr2CfSLRQ2Kq6EYSDTKgGLgET",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-gst",
    projectId: TokenProjectId.SwimSolanaGstBinanceGstLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "BM3sXSfRg1yKzf2AbTA5QV76MdnKHi9M8D7VCGzDEYM1",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-gmt",
    projectId: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "5VUZL2JcvbmjuT1DzDyWJ4mwtEH8unKyuQj3k38j8Ngs",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-aurora-usdc",
    projectId: TokenProjectId.SwimAuroraUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "AQiHPuuBPsq4MLLjLv2WHRFbrNB1JHZeR4mQGVJTwVHn",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-aurora-usdt",
    projectId: TokenProjectId.SwimAuroraUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "utXdXdUMaS5qrBDDUg5btQMGL2CedouzmMPbYMJPEZD",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !process.env.REACT_APP_ENABLE_AURORA_USN,
    id: "testnet-solana-lp-meta-aurora-usn",
    projectId: TokenProjectId.SwimAuroraUsnLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "11111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-fantom-usdc",
    projectId: TokenProjectId.SwimFantomUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "4hmRgsk3hSdK1gXV7rg1pStwYtntKmbcFQyKqsZ4USis",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-karura-ausd",
    projectId: TokenProjectId.SwimKaruraAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "4idDPnTYR4J9YhXmayKZYW8QBrASuuiTAxfkWUeaL3ap",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-solana-lp-meta-karura-usdt",
    projectId: TokenProjectId.SwimKaruraUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "882uzB9euTbBQJ6MrGrvxjXSTQi23VBQZcLcTH4E5Xow",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Acala),
    id: "testnet-solana-lp-meta-acala-ausd",
    projectId: TokenProjectId.SwimAcalaAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "BTbHtbUtDX5WAUSxPgELzy9VsbMbKAVFQ2hykNrD3X7L",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "testnet-ethereum-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
    id: "testnet-bnb-busd",
    projectId: TokenProjectId.Busd,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Gst,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Gmt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    id: "testnet-avalanche-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Avalanche,
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
    nativeEcosystemId: EvmEcosystemId.Avalanche,
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
    id: "testnet-polygon-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Polygon,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Polygon,
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
    id: "testnet-aurora-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Aurora,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Aurora,
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
    isDisabled: !process.env.REACT_APP_ENABLE_AURORA_USN,
    id: "testnet-aurora-usn",
    projectId: TokenProjectId.Usn,
    nativeEcosystemId: EvmEcosystemId.Aurora,
    nativeDetails: {
      address: "0x0000000000000000000000000000000000000000", // TODO: Update
      decimals: 18,
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "11111111111111111111111111111111", // TODO: Update
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "testnet-fantom-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Fantom,
    nativeDetails: {
      address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "9uJH6SjzmoqdiZXjcwYKuRevbYh5tR449FU5pg4rpden",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "testnet-karura-ausd",
    projectId: TokenProjectId.Ausd,
    nativeEcosystemId: EvmEcosystemId.Karura,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Karura,
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
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Acala),
    id: "testnet-acala-ausd",
    projectId: TokenProjectId.Ausd,
    nativeEcosystemId: EvmEcosystemId.Acala,
    nativeDetails: {
      address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
      decimals: 12,
    },
    wrappedDetails: new Map([
      [
        SOLANA_ECOSYSTEM_ID,
        {
          address: "BbdPh2Nvpp7XftBHWENJu5dpC5gF5FtCSyFLTU4qNr7g",
          decimals: 8,
        },
      ],
    ]),
  },
  TESTNET_SWIMUSD,
  ...TESTNET_TOKENS_FOR_RESTRUCTURE,
].filter((spec) => !spec.isDisabled);

const LOCAL_TOKENS: readonly TokenConfig[] = [
  {
    id: "local-solana-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x81681EC304dcfe2Ddad462E7e968C49A848410c3",
          decimals: 6,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x04C5Bf0f72FC1a9F50Ff3228C6285491ad00e13E",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "local-solana-usdt",
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
      decimals: 6,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0xa22915e82eb27fb64988Efa3d2749838174ccCBE",
          decimals: 6,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x23F55d75CFBe4334031dc7a19bf030613E966b2B",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "local-solana-lp-hexapool",
    projectId: TokenProjectId.SwimUsd,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
      decimals: 8,
    },
    wrappedDetails: new Map([
      [
        EvmEcosystemId.Ethereum,
        {
          address: "0x56cd8686e818c0C29983eA32fa6938618b35923f",
          decimals: 8,
        },
      ],
      [
        EvmEcosystemId.Bnb,
        {
          address: "0x7231BBdaB2F3814664f6E1f072A5ae0525709431",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "local-solana-swim",
    projectId: TokenProjectId.Swim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "local-solana-lp-swimlake",
    projectId: TokenProjectId.XSwim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "xSwy12tTsuYwM2Hd7ceNmvDftgxJ2ZSTycjzAfrNwPW",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "local-ethereum-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
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
  {
    id: "local-bnb-busd",
    projectId: TokenProjectId.Busd,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
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
];

export const TOKENS: ReadonlyRecord<Env, readonly TokenConfig[]> = {
  [Env.Mainnet]: MAINNET_TOKENS,
  [Env.Testnet]: TESTNET_TOKENS,
  [Env.Local]: LOCAL_TOKENS,
  [Env.Custom]: LOCAL_TOKENS,
};
