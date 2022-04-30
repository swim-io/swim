import BUSD_SVG from "../images/busd.svg";
import SWIM_TOKEN_SVG from "../images/swim_token.svg";
import SWIM_USD_SVG from "../images/swim_usd.svg";
import USDC_SVG from "../images/usdc.svg";
import USDT_SVG from "../images/usdt.svg";
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

const USDC_SYMBOL = "USDC";
const USDC_NAME = "USD Coin";
const USDT_SYMBOL = "USDT";
const USDT_NAME = "Tether USD";
const BUSD_SYMBOL = "BUSD";
const BUSD_NAME = "Binance USD";

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
    id: "devnet-solana-lp-hexapool",
    symbol: "swimUSD",
    displayName: "swimUSD (Swim Hexapool LP)",
    icon: SWIM_USD_SVG,
    isStablecoin: false,
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
          address: "0x81681EC304dcfe2Ddad462E7e968C49A848410c3",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0xbcB873e64edfe972E88f6A83fB8C4896aDb524f5",
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
          address: "0x8b87B61f40fa48EA16CCC45d5430C64ee29f490b",
          decimals: 6,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0xa22915e82eb27fb64988Efa3d2749838174ccCBE",
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
    isStablecoin: false,
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
          address: "0xA3E58c106aeFE2E0cF38702A149192f92c893A9e",
          decimals: 8,
        },
      ],
      [
        EcosystemId.Bsc,
        {
          address: "0x879990E41a6A3A4a91bA67eF5dd7C35675cBbce8",
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
