import { Env } from "@swim-io/core";
import type { TokenConfig, TokenDetails } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";

import type { EcosystemId } from "./ecosystem";
import { isEcosystemEnabled } from "./ecosystem";
import { isPoolRestructureEnabled } from "./pools";

export interface TokenSpec extends TokenConfig {
  readonly projectId: TokenProjectId;
  readonly nativeEcosystemId: EcosystemId;
  readonly wrappedDetails: ReadonlyMap<EcosystemId, TokenDetails>;
}

// NOTE: Use a shared empty map to save memory
const EMPTY_MAP: TokenSpec["wrappedDetails"] = new Map();

export const DEVNET_SWIMUSD: TokenSpec = {
  isDisabled: !isPoolRestructureEnabled(),
  id: "devnet-swimusd",
  projectId: TokenProjectId.SwimLpSolanaUsdcUsdt,
  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
  nativeDetails: {
    address: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr", // TODO: Update
    decimals: 8,
  },
  wrappedDetails: new Map([
    [
      EvmEcosystemId.Acala,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Aurora,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Avalanche,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Bnb,
      {
        address: "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Ethereum,
      {
        address: "0x4DF39C514Eb1747bb4D89cA9Ee35718611590935", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Fantom,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Karura,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
    [
      EvmEcosystemId.Polygon,
      {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    ],
  ]),
};

export const DEVNET_TOKENS_FOR_RESTRUCTURE: readonly TokenSpec[] = [
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "devnet-ethereum-lp-usdc-usdt",
    projectId: TokenProjectId.SwimLpEthereumUsdcUsdt,
    nativeEcosystemId: EvmEcosystemId.Ethereum,
    nativeDetails: {
      address: "0x3251239Dc476CED28EC2BCE7493D049bb7Ce18Dc", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "devnet-bnb-lp-busd-usdt",
    projectId: TokenProjectId.SwimLpBnbBusdUsdt,
    nativeEcosystemId: EvmEcosystemId.Bnb,
    nativeDetails: {
      address: "0xaadEE3D65519d1674a9DAeD7CC7e1f878323E455", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isPoolRestructureEnabled(),
    id: "devnet-avalanche-lp-usdc-usdt",
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
    id: "devnet-polygon-lp-usdc-usdt",
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
    id: "devnet-aurora-lp-usdc-usdt",
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
    id: "devnet-aurora-lp-usn",
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
    id: "devnet-fantom-lp-usdc",
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
    id: "devnet-karura-lp-usdt",
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
    id: "devnet-karura-lp-ausd",
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
    id: "devnet-acala-lp-ausd",
    projectId: TokenProjectId.SwimLpAcalaAusd,
    nativeEcosystemId: EvmEcosystemId.Acala,
    nativeDetails: {
      address: "0x1111111111111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
];

export const DEVNET_TOKENS: readonly TokenSpec[] = [
  {
    id: "devnet-solana-usdc",
    projectId: TokenProjectId.Usdc,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "2w7wsGofEAvLiWXZgJySXZ4gofEhm8jQ9rtwXr1zbzUc",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-usdt",
    projectId: TokenProjectId.Usdt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "DznJzVAjPHBvyyqXEQgPWTonF2nhwoSoutPNbXjmsUvY",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-gst",
    projectId: TokenProjectId.Gst,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-gmt",
    projectId: TokenProjectId.Gmt,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-hexapool",
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
    id: "devnet-solana-swim",
    projectId: TokenProjectId.Swim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-swimlake",
    projectId: TokenProjectId.XSwim,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
      decimals: 6,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-avalanche-usdc",
    projectId: TokenProjectId.SwimAvalancheUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-avalanche-usdt",
    projectId: TokenProjectId.SwimAvalancheUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "D6PuZckpEcBhVcpfgjgbWnARhFD3ApHhvnxBGWR6MW5Z",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-polygon-usdc",
    projectId: TokenProjectId.SwimPolygonUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "6WBFbyA3XJ3T2BeqA9JbyZFfj3KTCRtnC8MJANBsVNrz",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-polygon-usdt",
    projectId: TokenProjectId.SwimPolygonUsdtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "HH3RwS94BWhR4bKeNYGvr2CfSLRQ2Kq6EYSDTKgGLgET",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-gst",
    projectId: TokenProjectId.SwimSolanaGstBinanceGstLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "BM3sXSfRg1yKzf2AbTA5QV76MdnKHi9M8D7VCGzDEYM1",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-gmt",
    projectId: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "5VUZL2JcvbmjuT1DzDyWJ4mwtEH8unKyuQj3k38j8Ngs",
      decimals: 9,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-aurora-usdc",
    projectId: TokenProjectId.SwimAuroraUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "AQiHPuuBPsq4MLLjLv2WHRFbrNB1JHZeR4mQGVJTwVHn",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-solana-lp-meta-aurora-usdt",
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
    id: "devnet-solana-lp-meta-aurora-usn",
    projectId: TokenProjectId.SwimAuroraUsnLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "11111111111111111111111111111111", // TODO: Update
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Fantom),
    id: "devnet-solana-lp-meta-fantom-usdc",
    projectId: TokenProjectId.SwimFantomUsdcLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "4hmRgsk3hSdK1gXV7rg1pStwYtntKmbcFQyKqsZ4USis",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Karura),
    id: "devnet-solana-lp-meta-karura-ausd",
    projectId: TokenProjectId.SwimKaruraAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "4idDPnTYR4J9YhXmayKZYW8QBrASuuiTAxfkWUeaL3ap",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Karura),
    id: "devnet-solana-lp-meta-karura-usdt",
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
    id: "devnet-solana-lp-meta-acala-ausd",
    projectId: TokenProjectId.SwimAcalaAusdLp,
    nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
    nativeDetails: {
      address: "BTbHtbUtDX5WAUSxPgELzy9VsbMbKAVFQ2hykNrD3X7L",
      decimals: 8,
    },
    wrappedDetails: EMPTY_MAP,
  },
  {
    id: "devnet-ethereum-usdc",
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
    id: "devnet-ethereum-usdt",
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
    id: "devnet-bnb-busd",
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
    id: "devnet-bnb-usdt",
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
    id: "devnet-bnb-gst",
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
    id: "devnet-bnb-gmt",
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
    id: "devnet-avalanche-usdc",
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
    id: "devnet-avalanche-usdt",
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
    id: "devnet-polygon-usdc",
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
    id: "devnet-polygon-usdt",
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
    id: "devnet-aurora-usdc",
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
    id: "devnet-aurora-usdt",
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
    id: "devnet-aurora-usn",
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
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Fantom),
    id: "devnet-fantom-usdc",
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
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Karura),
    id: "devnet-karura-ausd",
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
    isDisabled: !isEcosystemEnabled(EvmEcosystemId.Karura),
    id: "devnet-karura-usdt",
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
    id: "devnet-acala-ausd",
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
  DEVNET_SWIMUSD,
  ...DEVNET_TOKENS_FOR_RESTRUCTURE,
].filter((spec) => !spec.isDisabled);

const defaultStablecoinTokenSpec: TokenSpec = {
  id: "test-stablecoin",
  projectId: TokenProjectId.Usdc,
  nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
  nativeDetails: { address: "xxx", decimals: 8 },
  wrappedDetails: new Map([
    [EvmEcosystemId.Bnb, { address: "xxx", decimals: 18 }],
  ]),
};

export const TOKENS: ReadonlyRecord<Env, readonly TokenSpec[]> = {
  [Env.Mainnet]: [defaultStablecoinTokenSpec],
  [Env.Devnet]: DEVNET_TOKENS,
  [Env.Local]: [defaultStablecoinTokenSpec],
  [Env.Custom]: [defaultStablecoinTokenSpec],
};
