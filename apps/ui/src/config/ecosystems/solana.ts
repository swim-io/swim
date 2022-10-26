import type { TokenDetails } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { SOLANA_ECOSYSTEM_ID, solana as solanaFromSdk } from "@swim-io/solana";
import { assertType } from "@swim-io/utils";

import type { EcosystemId } from "../ecosystem";
import { TokenProjectIdV1 } from "../tokenProjects";

import { bnb } from "./bnb";
import { ethereum } from "./ethereum";
import type { SolanaChainConfigV1, SolanaEcosystemConfigV1 } from "./types";

const EMPTY_MAP: ReadonlyMap<EcosystemId, TokenDetails> = new Map();
const BNB_ECOSYSTEM_ID = bnb.id;
const ETHEREUM_ECOSYSTEM_ID = ethereum.id;

const mainnet: SolanaChainConfigV1 = {
  ...solanaFromSdk.chains[Env.Mainnet],
  tokens: [
    {
      id: "mainnet-solana-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x41f7B8b9b897276b7AAE926a9016935280b44E97",
            decimals: 6,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x91Ca579B0D47E5cfD5D0862c21D5659d39C8eCf0",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-solana-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C",
            decimals: 6,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x49d5cC521F75e13fa8eb4E89E9D381352C897c96",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-solana-gst",
      projectId: TokenProjectIdV1.Gst,
      nativeDetails: {
        address: "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-gmt",
      projectId: TokenProjectIdV1.Gmt,
      nativeDetails: {
        address: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-hexapool",
      projectId: TokenProjectIdV1.SwimUsdV1,
      nativeDetails: {
        address: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x01F369bF2d5a62CE60B0a2E92143CD623BeCb0fB",
            decimals: 8,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0xF78479d516A12b9cFb000951D19f67B4fE0B065d",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-solana-lp-meta-avalanche-usdc",
      projectId: TokenProjectIdV1.SwimAvalancheUsdcLp,
      nativeDetails: {
        address: "DKwsWeqHrB8R1u2DFMHKtq4iqaQNgPgUbHTJyXPqkTzK",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-avalanche-usdt",
      projectId: TokenProjectIdV1.SwimAvalancheUsdtLp,
      nativeDetails: {
        address: "5rwvDmUbcnZTwZ4Zywev2wnDbyDDD2vcsGU2Xmy7aRNS",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-polygon-usdc",
      projectId: TokenProjectIdV1.SwimPolygonUsdcLp,
      nativeDetails: {
        address: "ANFojEXhiEQQoovhBs77XmBQuqbe59UBygRWViyf4945",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-polygon-usdt",
      projectId: TokenProjectIdV1.SwimPolygonUsdtLp,
      nativeDetails: {
        address: "2Nx6L79dHHgHcJtNfZWukQkWZvf5h4bps34zuh1gjtdP",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-gst",
      projectId: TokenProjectIdV1.SwimSolanaGstBinanceGstLp,
      nativeDetails: {
        address: "8YYBkTNhpY9mFdCdZWM6mHNf8J6A9hGfimb33LEiiZ3x",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-gmt",
      projectId: TokenProjectIdV1.SwimSolanaGmtBinanceGmtLp,
      nativeDetails: {
        address: "2x7MjgopLXd3qETGLpY19cyZjHvVnGkrwVjTkJnBza4A",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-aurora-usdc",
      projectId: TokenProjectIdV1.SwimAuroraUsdcLp,
      nativeDetails: {
        address: "9qRe2nBrR2rTXxRaV1PZN9hZnqq3UXgoFWTbP6NE3MEu",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-aurora-usdt",
      projectId: TokenProjectIdV1.SwimAuroraUsdtLp,
      nativeDetails: {
        address: "4XPDxtGbcM7bAPKZxALd2s862n3WoG4xPPvyCPVULKAb",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-fantom-usdc",
      projectId: TokenProjectIdV1.SwimFantomUsdcLp,
      nativeDetails: {
        address: "J5ifGexAQTg76TresJhJSqTPJLT6BNxrV5rwNJTTz4Cx",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-karura-ausd",
      projectId: TokenProjectIdV1.SwimKaruraAusdLp,
      nativeDetails: {
        address: "8vzXSNVAX4fymEFahJFh1ypzDBFv3QMVaZ4GtJWHrRjU",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-karura-usdt",
      projectId: TokenProjectIdV1.SwimKaruraUsdtLp,
      nativeDetails: {
        address: "2sXvitirRSjgTTNzGNWAFZWSqEx87kDoTJvqG9JSyivh",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-acala-ausd",
      projectId: TokenProjectIdV1.SwimAcalaAusdLp,
      nativeDetails: {
        address: "11111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-swim",
      projectId: TokenProjectIdV1.Swim,
      nativeDetails: {
        address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-swimlake",
      projectId: TokenProjectIdV1.XSwim,
      nativeDetails: {
        address: "SwiMNJ49SxkqMaVWLGGVRH25kE5dBnD2RQoiQUnKtMC",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [],
};

const testnet: SolanaChainConfigV1 = {
  ...solanaFromSdk.chains[Env.Testnet],
  tokens: [
    {
      id: "testnet-solana-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "6iSRgpK4oiqJZuhpLsTecW3n9xBKUq9N3VPQN7RinYwq",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "8VbikoRxEoyYzTDzDcPTSsGk2E5mM7fK1WrVpKrVd75M",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-gst",
      projectId: TokenProjectIdV1.Gst,
      nativeDetails: {
        address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-gmt",
      projectId: TokenProjectIdV1.Gmt,
      nativeDetails: {
        address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-hexapool",
      projectId: TokenProjectIdV1.SwimUsdV1,
      nativeDetails: {
        address: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x4DF39C514Eb1747bb4D89cA9Ee35718611590935",
            decimals: 8,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-solana-swim",
      projectId: TokenProjectIdV1.Swim,
      nativeDetails: {
        address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-swimlake",
      projectId: TokenProjectIdV1.XSwim,
      nativeDetails: {
        address: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-avalanche-usdc",
      projectId: TokenProjectIdV1.SwimAvalancheUsdcLp,
      nativeDetails: {
        address: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-avalanche-usdt",
      projectId: TokenProjectIdV1.SwimAvalancheUsdtLp,
      nativeDetails: {
        address: "D6PuZckpEcBhVcpfgjgbWnARhFD3ApHhvnxBGWR6MW5Z",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-polygon-usdc",
      projectId: TokenProjectIdV1.SwimPolygonUsdcLp,
      nativeDetails: {
        address: "6WBFbyA3XJ3T2BeqA9JbyZFfj3KTCRtnC8MJANBsVNrz",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-polygon-usdt",
      projectId: TokenProjectIdV1.SwimPolygonUsdtLp,
      nativeDetails: {
        address: "HH3RwS94BWhR4bKeNYGvr2CfSLRQ2Kq6EYSDTKgGLgET",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-gst",
      projectId: TokenProjectIdV1.SwimSolanaGstBinanceGstLp,
      nativeDetails: {
        address: "BM3sXSfRg1yKzf2AbTA5QV76MdnKHi9M8D7VCGzDEYM1",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-gmt",
      projectId: TokenProjectIdV1.SwimSolanaGmtBinanceGmtLp,
      nativeDetails: {
        address: "5VUZL2JcvbmjuT1DzDyWJ4mwtEH8unKyuQj3k38j8Ngs",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-aurora-usdc",
      projectId: TokenProjectIdV1.SwimAuroraUsdcLp,
      nativeDetails: {
        address: "AQiHPuuBPsq4MLLjLv2WHRFbrNB1JHZeR4mQGVJTwVHn",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-aurora-usdt",
      projectId: TokenProjectIdV1.SwimAuroraUsdtLp,
      nativeDetails: {
        address: "utXdXdUMaS5qrBDDUg5btQMGL2CedouzmMPbYMJPEZD",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-fantom-usdc",
      projectId: TokenProjectIdV1.SwimFantomUsdcLp,
      nativeDetails: {
        address: "4hmRgsk3hSdK1gXV7rg1pStwYtntKmbcFQyKqsZ4USis",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-karura-ausd",
      projectId: TokenProjectIdV1.SwimKaruraAusdLp,
      nativeDetails: {
        address: "4idDPnTYR4J9YhXmayKZYW8QBrASuuiTAxfkWUeaL3ap",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-karura-usdt",
      projectId: TokenProjectIdV1.SwimKaruraUsdtLp,
      nativeDetails: {
        address: "882uzB9euTbBQJ6MrGrvxjXSTQi23VBQZcLcTH4E5Xow",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-acala-ausd",
      projectId: TokenProjectIdV1.SwimAcalaAusdLp,
      nativeDetails: {
        address: "BTbHtbUtDX5WAUSxPgELzy9VsbMbKAVFQ2hykNrD3X7L",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [
    {
      id: "two-pool",
      displayName: "Two Pool",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      address: "EGm6UfAJ6LFy8WRxE2YjjJzwUbZ1ZFiuG2rP6YudKKBB",
      contract: "8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM",
      governanceFeeAccount: "FN9strke8tiDYmRNH3LFtg9zjJpTsxgTPHUegsQsUiai",
      lpTokenId: "swimUSD",
      tokenIds: ["testnet-solana-usdc", "testnet-solana-usdt"],
      tokenAccounts: new Map([
        ["testnet-solana-usdc", "49fm8MaATyD4BwaqxXmjASGuR3WLg8PL1SvMiYpyTdrx"],
        ["testnet-solana-usdt", "849M4dvrdoUqsn7t6eVWWNos8Q8RfLJxRTzQC46KGoYE"],
      ]),
      feeDecimals: 6,
      isStableSwap: true,
      isStakingPool: false,
    },
  ],
};

const localnet: SolanaChainConfigV1 = {
  ...solanaFromSdk.chains[Env.Local],
  tokens: [
    {
      id: "local-solana-usdc",
      projectId: TokenProjectIdV1.Usdc,
      nativeDetails: {
        address: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x81681EC304dcfe2Ddad462E7e968C49A848410c3",
            decimals: 6,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x04C5Bf0f72FC1a9F50Ff3228C6285491ad00e13E",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "local-solana-usdt",
      projectId: TokenProjectIdV1.Usdt,
      nativeDetails: {
        address: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0xa22915e82eb27fb64988Efa3d2749838174ccCBE",
            decimals: 6,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x23F55d75CFBe4334031dc7a19bf030613E966b2B",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "local-solana-lp-hexapool",
      projectId: TokenProjectIdV1.SwimUsdV1,
      nativeDetails: {
        address: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          ETHEREUM_ECOSYSTEM_ID,
          {
            address: "0x56cd8686e818c0C29983eA32fa6938618b35923f",
            decimals: 8,
          },
        ],
        [
          BNB_ECOSYSTEM_ID,
          {
            address: "0x7231BBdaB2F3814664f6E1f072A5ae0525709431",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "local-solana-swim",
      projectId: TokenProjectIdV1.Swim,
      nativeDetails: {
        address: "SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "local-solana-lp-swimlake",
      projectId: TokenProjectIdV1.XSwim,
      nativeDetails: {
        address: "xSwy12tTsuYwM2Hd7ceNmvDftgxJ2ZSTycjzAfrNwPW",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [],
};

export const solana = assertType<SolanaEcosystemConfigV1>()({
  ...solanaFromSdk,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
