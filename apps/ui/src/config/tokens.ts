import BUSD_SVG from "../images/tokens/busd.svg";
import GMT_SVG from "../images/tokens/gmt.svg";
import GST_SVG from "../images/tokens/gst.svg";
import LP_GMT_SVG from "../images/tokens/lp_gmt.svg";
import LP_GST_SVG from "../images/tokens/lp_gst.svg";
import LP_META_AVALANCHE_USDC_SVG from "../images/tokens/lp_metapool_avalanche_usdc.svg";
import LP_META_AVALANCHE_USDT_SVG from "../images/tokens/lp_metapool_avalanche_usdt.svg";
import LP_META_POLYGON_USDC_SVG from "../images/tokens/lp_metapool_polygon_usdc.svg";
import LP_META_POLYGON_USDT_SVG from "../images/tokens/lp_metapool_polygon_usdt.svg";
import SWIM_TOKEN_SVG from "../images/tokens/swim_token.svg";
import SWIM_USD_SVG from "../images/tokens/swim_usd.svg";
import USDC_SVG from "../images/tokens/usdc.svg";
import USDT_SVG from "../images/tokens/usdt.svg";
import type { ReadonlyRecord } from "../utils";

import { EcosystemId } from "./ecosystem";
import { Env } from "./env";

export interface TokenDetails {
  readonly address: string;
  readonly decimals: number;
}

export type TokenDetailsByEcosystem = ReadonlyMap<EcosystemId, TokenDetails>;

export interface TokenSpec {
  readonly id: string;
  readonly symbol: string;
  readonly displayName: string;
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly nativeEcosystem: EcosystemId;
  readonly detailsByEcosystem: TokenDetailsByEcosystem;
}

const BUSD_SYMBOL = "BUSD";
const BUSD_NAME = "Binance USD";
const GST_SYMBOL = "GST";
const GST_NAME = "Green Satoshi Token";
const GMT_SYMBOL = "GMT";
const GMT_NAME = "STEPN";
const USDC_SYMBOL = "USDC";
const USDC_NAME = "USD Coin";
const USDT_SYMBOL = "USDT";
const USDT_NAME = "Tether USD";

const mainnetTokens: readonly TokenSpec[] = [
  {
    id: "mainnet-solana-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0x41f7B8b9b897276b7AAE926a9016935280b44E97",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x91Ca579B0D47E5cfD5D0862c21D5659d39C8eCf0",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x49d5cC521F75e13fa8eb4E89E9D381352C897c96",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-hexapool",
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0x01F369bF2d5a62CE60B0a2E92143CD623BeCb0fB",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0xF78479d516A12b9cFb000951D19f67B4fE0B065d",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-meta-avalanche-usdc",
    symbol: "SWIM-AVALANCHE-USDC-META-POOL-LP",
    displayName: "Avalanche USDC Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "DKwsWeqHrB8R1u2DFMHKtq4iqaQNgPgUbHTJyXPqkTzK",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-meta-avalanche-usdt",
    symbol: "SWIM-AVALANCHE-USDT-META-POOL-LP",
    displayName: "Avalanche USDT Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "5rwvDmUbcnZTwZ4Zywev2wnDbyDDD2vcsGU2Xmy7aRNS",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-meta-polygon-usdc",
    symbol: "SWIM-POLYGON-USDC-META-POOL-LP",
    displayName: "Polygon USDC Meta-Pool LP",
    icon: LP_META_POLYGON_USDC_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "ANFojEXhiEQQoovhBs77XmBQuqbe59UBygRWViyf4945",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-solana-lp-meta-polygon-usdt",
    symbol: "SWIM-POLYGON-USDT-META-POOL-LP",
    displayName: "Polygon USDT Meta-Pool LP",
    icon: LP_META_POLYGON_USDT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "2Nx6L79dHHgHcJtNfZWukQkWZvf5h4bps34zuh1gjtdP",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-ethereum-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-ethereum-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-bsc-busd",
    symbol: BUSD_SYMBOL,
    displayName: BUSD_NAME,
    icon: BUSD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-bsc-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x55d398326f99059ff775485246999027b3197955",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "mainnet-avalanche-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Avalanche,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Avalanche,
        {
          address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "FHfba3ov5P3RjaiLVgh8FTv4oirxQDoVXuoUUDvHuXax",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-avalanche-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Avalanche,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Avalanche,
        {
          address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "Kz1csQA91WUGcQ2TB3o5kdGmWmMGp8eJcDEyHzNDVCX",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-polygon-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Polygon,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Polygon,
        {
          address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "mainnet-polygon-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Polygon,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Polygon,
        {
          address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "5goWRao6a3yNC4d6UjMdQxonkCMvKBwdpubU3qhfcdf1",
          decimals: 6,
        },
      ],
    ]),
  },
];

const devnetTokens: readonly TokenSpec[] = [
  {
    id: "devnet-solana-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "2w7wsGofEAvLiWXZgJySXZ4gofEhm8jQ9rtwXr1zbzUc",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "DznJzVAjPHBvyyqXEQgPWTonF2nhwoSoutPNbXjmsUvY",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-gst",
    symbol: GST_SYMBOL,
    displayName: GST_NAME,
    icon: GST_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
          decimals: 9,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-gmt",
    symbol: GMT_SYMBOL,
    displayName: GMT_NAME,
    icon: GMT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
          decimals: 9,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-hexapool",
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "GNZg1XdctYfRS4HEnhyeaYrJJTrrY2yhtZAvp1SxdEHU",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0xb2f01d78cc3D08CCbE2Fa335c75aeaF16612f8E2",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x3EC401f8E1B75bEb1994Db31d48dA5bEb1124Baa",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-swim",
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-swimlake",
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: SWIM_USD_SVG, // TODO: Change?
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-meta-avalanche-usdc",
    symbol: "SWIM-AVALANCHE-USDC-META-POOL-LP",
    displayName: "Avalanche USDC Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDC_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "7xt1Qrs78dLumZdpxgeQ4TmRzSS9WWpYdGugzcB2pgb3",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-meta-avalanche-usdt",
    symbol: "SWIM-AVALANCHE-USDT-META-POOL-LP",
    displayName: "Avalanche USDT Meta-Pool LP",
    icon: LP_META_AVALANCHE_USDT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "CSJz1NkebFj4pjYps9fDaS8KpvQ1SVWhhRNFMYnkrqDP",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-meta-polygon-usdc",
    symbol: "SWIM-POLYGON-USDC-META-POOL-LP",
    displayName: "Polygon USDC Meta-Pool LP",
    icon: LP_META_POLYGON_USDC_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "9SexMyV5iREyyzLktd4iHtQMug5fXv4baDkgNvy95d45",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-meta-polygon-usdt",
    symbol: "SWIM-POLYGON-USDT-META-POOL-LP",
    displayName: "Polygon USDT Meta-Pool LP",
    icon: LP_META_POLYGON_USDT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "EiqbvyTkdcruHrjDy9RtyXpvRfRDmN7Mtutv7J4uWG46",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-gst",
    symbol: "solaGST-binaGST",
    displayName: "Swim Solana GST Binance GST LP",
    icon: LP_GST_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "BM3sXSfRg1yKzf2AbTA5QV76MdnKHi9M8D7VCGzDEYM1",
          decimals: 9,
        },
      ],
    ]),
  },
  {
    id: "devnet-solana-lp-gmt",
    symbol: "solaGMT-binaGMT",
    displayName: "Swim Solana GMT Binance GMT LP",
    icon: LP_GMT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "5VUZL2JcvbmjuT1DzDyWJ4mwtEH8unKyuQj3k38j8Ngs",
          decimals: 9,
        },
      ],
    ]),
  },
  {
    id: "devnet-ethereum-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "7Lf95y8NuCU5RRC95oUtbBtckPAtbr9ubTgrCiyZ1kEf",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-ethereum-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "8Cfyi1mYXqKATUkMPvb9BMXikdbppJst6E7eQJkKjAtf",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-bsc-busd",
    symbol: BUSD_SYMBOL,
    displayName: BUSD_NAME,
    icon: BUSD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "6KTvgrkLoPJdB3Grv4ZBUGt6JiLdVnKzJNo4HvLEgm6d",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-bsc-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x98529E942FD121d9C470c3d4431A008257E0E714",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "4dr6ogcLsaFf2RDF4LJU1CvNtNKxonVqQvM6vuGdVR1e",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-bsc-gst",
    symbol: GST_SYMBOL,
    displayName: GST_NAME,
    icon: GST_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x73160078948280B8680e5F1eB2964698928E8cd7",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "6oAiihJq1urtb6P8ARjwA6TFoduSoVGxaMb8gEMm5cR6",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-bsc-gmt",
    symbol: GMT_SYMBOL,
    displayName: GMT_NAME,
    icon: GMT_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x1F65D61D01E3f10b34B855287b32D7bfbEA088D0",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "GE2tiQBCoPjCABkoTXa9jTSV8zCVZo8shyiBh8v52hDz",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "devnet-avalanche-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Avalanche,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Avalanche,
        {
          address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "2t6pVTufn9A4b37oLmex3YMjm3smp1G9tPd9HpAFSeka",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-avalanche-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Avalanche,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Avalanche,
        {
          address: "0x489dDcd070b6c4e0373FBB5d529Cc06328E048c3",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "9ibet2CuBX1a4HpbzH9auxxtyUvkSKVy39jWtZY5Bfor",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-polygon-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Polygon,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Polygon,
        {
          address: "0x0a0d7cEA57faCBf5DBD0D3b5169Ab00AC8Cf7dd1",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "D5YvMW5U3HUpD1EstYbKmmZsLdmCPgUj44JqBmNY7fUM",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "devnet-polygon-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Polygon,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Polygon,
        {
          address: "0x2Ac9183EC64F71AfB73909c7C028Db14d35FAD2F",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "2otzQWyoydNp4Ws1kV8J8WVYiun6wmuFMMbicgdoEULn",
          decimals: 6,
        },
      ],
    ]),
  },
];

const localnetTokens: readonly TokenSpec[] = [
  {
    id: "localnet-solana-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0xBeE60159B8b68F1d71095Cfae26B48C940D00d90",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0xaeb802A5A51267116728dEA7B8fA6d9F9dE8ec65",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "localnet-solana-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0x3235869d740B5549b954F446fA2a3f757bB1603A",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x382782faee2BD31265333ba3865980DaabF582a0",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "localnet-solana-lp-hexapool",
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Ethereum,
        {
          address: "0x7ce34459F472AC89B6b576108CA4D969C79eE7f1",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x8078DC006B27e2dDfdd0a98B0334f53615D1E199",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "localnet-solana-swim",
    symbol: "SWIM",
    displayName: "Swim Protocol Token",
    icon: SWIM_TOKEN_SVG,
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "localnet-solana-lp-swimlake",
    symbol: "xSWIM",
    displayName: "xSWIM (SwimLake LP)",
    icon: SWIM_USD_SVG, // TODO: Change?
    isStablecoin: false,
    nativeEcosystem: EcosystemId.Solana,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Solana,
        {
          address: "xSwy12tTsuYwM2Hd7ceNmvDftgxJ2ZSTycjzAfrNwPW",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "localnet-ethereum-usdc",
    symbol: USDC_SYMBOL,
    displayName: USDC_NAME,
    icon: USDC_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0xFcCeD5E997E7fb1D0594518D3eD57245bB8ed17E",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "Ep9cMbgyG46b6PVvJNypopc6i8TFzvUVmGiT4MA1PhSb",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "localnet-ethereum-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Ethereum,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Ethereum,
        {
          address: "0xdAA71FBBA28C946258DD3d5FcC9001401f72270F",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "9AGDY4Xa9wDfRZc2LHeSS9iAdH6Bhw6VnMd2t7tkJhYv",
          decimals: 6,
        },
      ],
    ]),
  },
  {
    id: "localnet-bsc-busd",
    symbol: BUSD_SYMBOL,
    displayName: BUSD_NAME,
    icon: BUSD_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0xCeeFD27e0542aFA926B87d23936c79c276A48277",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "4X3Fu7ZcRSf7dvKEwwQ8b5xb2jQg2NPNkWs1gDGf1WMg",
          decimals: 8,
        },
      ],
    ]),
  },
  {
    id: "localnet-bsc-usdt",
    symbol: USDT_SYMBOL,
    displayName: USDT_NAME,
    icon: USDT_SVG,
    isStablecoin: true,
    nativeEcosystem: EcosystemId.Bsc,
    detailsByEcosystem: new Map([
      [
        EcosystemId.Bsc,
        {
          address: "0x988B6CFBf3332FF98FFBdED665b1F53a61f92612",
          decimals: 18,
        },
      ],
      [
        EcosystemId.Solana,
        {
          address: "9idXDPGb5jfwaf5fxjiMacgUcwpy3ZHfdgqSjAV5XLDr",
          decimals: 8,
        },
      ],
    ]),
  },
];

export const tokens: ReadonlyRecord<Env, readonly TokenSpec[]> = {
  [Env.Mainnet]: mainnetTokens,
  [Env.Devnet]: devnetTokens,
  [Env.Localnet]: localnetTokens,
  [Env.CustomLocalnet]: localnetTokens,
};
