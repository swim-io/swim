import type { ReadonlyRecord } from "../utils";

import { EcosystemId, isEcosystemEnabled } from "./ecosystem";
import { Env } from "./env";

export interface PoolSpec {
  readonly id: string;
  readonly displayName: string;
  readonly isStakingPool: boolean;
  readonly isStableSwap: boolean;
  readonly contract: string;
  readonly address: string;
  readonly authority: string;
  readonly feeDecimals: number;
  readonly lpToken: string;
  /**
   * Maps token IDs to addresses of token accounts owned by the pool
   * Keys encode which tokens are included in the pool
   * Size encodes how many tokens are in the pool
   */
  readonly tokenAccounts: ReadonlyMap<string, string>;
  readonly isDisabled?: boolean;
}

const mainnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
    address: "8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma",
    authority: "AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-hexapool",
    tokenAccounts: new Map([
      ["mainnet-solana-usdc", "5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"],
      ["mainnet-solana-usdt", "Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"],
      ["mainnet-ethereum-usdc", "4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"],
      ["mainnet-ethereum-usdt", "2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"],
      ["mainnet-bsc-busd", "DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"],
      ["mainnet-bsc-usdt", "9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"],
    ]),
  },
  {
    id: "meta-avalanche-usdc",
    displayName: "Avalanche USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "AzJnv1DX2tNWZyQVeoAG71CoaSusr8q1qLPVxJEW4xMP",
    authority: "Ha7YEA5wRWyH2htfyMXw3VfLbtBHm4UoVXMpq8Ev6zJh",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-avalanche-usdc",
    tokenAccounts: new Map([
      [
        "mainnet-avalanche-usdc",
        "9RgAUVyd72THEnLLwZswBbc2VpmJnSPP9R91ZVxjq1rv",
      ],
      [
        "mainnet-solana-lp-hexapool",
        "6zbeCeeUGbjiiW9PpxVuMqLmWZowoaDsMmWtRmX5Nx5W",
      ],
    ]),
  },
  {
    id: "meta-avalanche-usdt",
    displayName: "Avalanche USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "2zG5Lk5GcoGWqarZjuQm2YtJ9sq9nCS5qPaddkmLJAxG",
    authority: "EpvBni7vTfbTG95zf9sNcS9To1NEKnVMpCwZdb21tKsg",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-avalanche-usdt",
    tokenAccounts: new Map([
      [
        "mainnet-avalanche-usdt",
        "52q1M9ceJozzfGTgD5wx6K2WQjvQnUpF3uKmWzdy73ER",
      ],
      [
        "mainnet-solana-lp-hexapool",
        "9QAFkr2tYntkeiWFS6KJYYBFLeKh6CBTqUwhCCBdhdbV",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdc",
    displayName: "Polygon USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "FRarK7GGuMBihxsu4F9wQPEemjLQ6xhATASSWfsZsAXX",
    authority: "2iLTifF3JDP65AjFKZ3t4mgfJdQVSmVCiM8Zca3TgvpU",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-polygon-usdc",
    tokenAccounts: new Map([
      ["mainnet-polygon-usdc", "DwjutE8CB1WNUzy78f44BdJNWMF1pYC5wd6eTchRcacL"],
      [
        "mainnet-solana-lp-hexapool",
        "9MQ6FFBm7Nk9jMY65m8MYvsno2akEGPLMLjargoccvic",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdt",
    displayName: "Polygon USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "7mCixtML8ApfdRQYBC77c2PGP55Lj1XGpmFVZ2CShaMq",
    authority: "3uxBU3fRZzp3V7v9MTNZiDmjxDkKh3rZutLwFtnjJ2pQ",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-polygon-usdt",
    tokenAccounts: new Map([
      ["mainnet-polygon-usdt", "A4KTWbPgxUeLWJdXyqsc7tV2GgkxW5gaKeHvKz3LLght"],
      [
        "mainnet-solana-lp-hexapool",
        "BBHCpu6xKDjvoUDTBmBmejAoN4ADNeZiYcvKfVv7yz3L",
      ],
    ]),
  },
  {
    id: "gst-solana-bnb",
    displayName: "GST SPL - GST BEP20",
    isStakingPool: false,
    isStableSwap: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "FRvGoXtVe5QLfBbodeaUxjzr6aqbwpSECDDV57SG5Tmf",
    authority: "57k3vNmCivSYn7EwQNjcNFcCWAdohZ9xACfMhJGwKiBq",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-gst",
    tokenAccounts: new Map([
      ["mainnet-bsc-gst", "APG2hZqzk54NVjscBZ13iEZ9StR4Jpv82767hpHJwFQ7"],
      ["mainnet-solana-gst", "Hv4t3QZhbb2enUYmXm2X2pRCJ4jsVNb8pRhLDqs6oHNZ"],
    ]),
  },
  {
    id: "gmt-solana-bnb",
    displayName: "GMT SPL - GMT BEP20",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "4Np8YkTg6wobPXPEG5GagdZUpZt863RqXs8TNcMcqxTR",
    authority: "HZr3bF8YEJWMV75Wi3aFEHEyLLk61VyQduXtunWtXNVQ",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-gmt",
    tokenAccounts: new Map([
      ["mainnet-bsc-gmt", "kCKv3PwjiopEDGjtztH3rbJvDvKiNGRk26iuSE1SDF1"],
      ["mainnet-solana-gmt", "2jakYHDLzK14LvGfQ6XMevkdXjmR2pptMxD6HLsDUDvx"],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Aurora),
    id: "meta-aurora-usdc",
    displayName: "Aurora USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "3w7ryrn4fJcc4dHoYSo8VNdysFRB93PVwT8L6YK2SQuw",
    authority: "DqTF8aZu63iHF55tBz1ePuaBKJ3F2srNVha3B4PpCT4N",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-aurora-usdc",
    tokenAccounts: new Map([
      ["mainnet-aurora-usdc", "5fJA79DSwdncsLfH31Awgzk8P1EmTRXfQJzQfRVJ6MsH"],
      [
        "mainnet-solana-lp-hexapool",
        "H7DP6XBwU7N6mWavF3qiqvuoSD3z6T3dtjGEmqkYy8mX",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Aurora),
    id: "meta-aurora-usdt",
    displayName: "Aurora USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "4t1cfAbmLjyLuBo1gsvCVKjVUR48ixqvS4dLKW8dtRvm",
    authority: "23CU3bqMJoRTpvyti84CmPbkAyNJDnTZE7DYj6MnhGdK",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-aurora-usdt",
    tokenAccounts: new Map([
      ["mainnet-aurora-usdt", "6VtNuUZR1CxBunrQBoNtjC2ZZWqhpmkWwdY8zhbFBcie"],
      [
        "mainnet-solana-lp-hexapool",
        "CpMPTJ72mqeVRK6569sGqkWCV5B6dSZpTCD7BAKW2QPo",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Aurora),
    id: "meta-aurora-usn",
    displayName: "Aurora USN Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "4Cos4Z3DaMa37MpvjfCEH93DqonPmDV3b6GuPvmWugqF",
    authority: "9dowtd9EbAtC9iKyXWaC5TBmHTivDfdQ6JbeTvHiCK6p",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-aurora-usn",
    tokenAccounts: new Map([
      ["mainnet-aurora-usn", "3dkbc5KuJSJ9ah87uVZRRLZMH1JKMaREQgcAkHSijWpR"],
      [
        "mainnet-solana-lp-hexapool",
        "9Ddfhn9P1BJvxtfCvgvKBfSiKSrwdDBBSUf9SdQkDDW5",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Fantom),
    id: "meta-fantom-usdc",
    displayName: "Fantom USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "GCbJStx8XY767Bnj6jj4hzeRJBpfDvrrZS8at3PbABu9",
    authority: "H7BkMwbJfLiWE9sSDATHTqXykm1xBjeRzzLDatW2QdEt",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-fantom-usdc",
    tokenAccounts: new Map([
      ["mainnet-fantom-usdc", "AHnZRtLz5J17F1X7Z8LJCk2yGxSpii1uMMyPrBEpPdgg"],
      [
        "mainnet-solana-lp-hexapool",
        "E7mgPEb7T7Q7RPUQpZ4XLJZPYiVhj41jyLVc8P3EGfWN",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Karura),
    id: "meta-karura-ausd",
    displayName: "Karura AUSD Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "GRBTi98rcqseFNGdBscPMMWFGBeadZsaN69Tya1dKDJi",
    authority: "5frFvM55BNXZfdhCL7iqm6DnYBiUijDQSWiNDyV8gAYL",
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-karura-ausd",
    tokenAccounts: new Map([
      ["mainnet-karura-ausd", "4ddm9KiJJsj2q8tdwz9GR9UgQkQsMMtVuoHn9bqR5BTe"],
      [
        "mainnet-solana-lp-hexapool",
        "5Z1ekWcEWukuaWWELfBVDs7xtnX7KZLRDQv6AttMMQaL",
      ],
    ]),
  },
  {
    // TODO: Remove manual disable. We are waiting from Acala to attest USDT.
    isDisabled: true,
    id: "meta-karura-usdt",
    displayName: "Karura USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "11111111111111111111111111111111", // TODO: Update
    authority: "11111111111111111111111111111111", // TODO: Update
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-karura-usdt",
    tokenAccounts: new Map([
      ["mainnet-karura-usdt", "11111111111111111111111111111111"], // TODO: Update
      [
        "mainnet-solana-lp-hexapool",
        "11111111111111111111111111111111", // TODO: Update
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Acala),
    id: "meta-acala-ausd",
    displayName: "Acala AUSD Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "11111111111111111111111111111111", // TODO: Update
    authority: "11111111111111111111111111111111", // TODO: Update
    feeDecimals: 6,
    lpToken: "mainnet-solana-lp-meta-acala-ausd",
    tokenAccounts: new Map([
      ["mainnet-acala-ausd", "11111111111111111111111111111111"], // TODO: Update
      [
        "mainnet-solana-lp-hexapool",
        "11111111111111111111111111111111", // TODO: Update
      ],
    ]),
  },
].filter((spec) => !spec.isDisabled);

const devnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
    address: "G4dYhqGrGwmx78ad8LXbGHRUfacRkmxycw3XJDWPW7Ec",
    authority: "B3rnh8XJq3F7sJDLu7Kr9z24KXxkHsvLmZB29FcVqe5A",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-hexapool",
    tokenAccounts: new Map([
      ["devnet-ethereum-usdc", "EqhKYj5VQ8C3c4RWrfnm1UdoFPQoKYTWJdRWnSpN73sz"],
      ["devnet-ethereum-usdt", "DR2pkTqM3bYHtcN6YDW4k9tnCDYbtrbwE61yzRMQn7h"],
      ["devnet-bsc-busd", "24kq1sAEyYgoT2H6SZEMQ8eqanyt7mDDhEQ1pLEhXCch"],
      ["devnet-bsc-usdt", "63voUkHQrDfULcCKXwU6i9MoENhjVyMWXgxCxnnaKx37"],
      ["devnet-solana-usdc", "66MCny16VUbuecNtvqXsLjdBSqVigeb31P14dtayH2jq"],
      ["devnet-solana-usdt", "4ZtpwjuxYC9VZBGAphBVpUVQzdy4anxF2ctJDp9xkpYA"],
    ]),
  },
  {
    id: "meta-avalanche-usdc",
    displayName: "Avalanche USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "212ehpMyQZPfD5cNtZMxzwTmQHkDoFhZjT4UyBCzAxFU",
    authority: "3cvyGruDFQ3uyxGPNHXLEQyZe3rLPiLsjvNkvSFTTURg",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-avalanche-usdc",
    tokenAccounts: new Map([
      ["devnet-avalanche-usdc", "4wVFKRTNK5RriQaRfMBm6BjRdnb5yqUFKmthQXmkCgho"],
      [
        "devnet-solana-lp-hexapool",
        "14j3ek3AD7UHgQYpvvRM8265Vh4SdXsvxNLyhgYuRTtb",
      ],
    ]),
  },
  {
    id: "meta-avalanche-usdt",
    displayName: "Avalanche USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "De2SEaTh5cAx6h6zSySdqbbHjVVhouoUyFscLp1vaUcp",
    authority: "DAP8h8zeYURm6FFvhnQ9pcNdwCSS2gsF3GmdcDeSeBx5",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-avalanche-usdt",
    tokenAccounts: new Map([
      ["devnet-avalanche-usdt", "Eda3mSE2nX2ynoFZxCorGgDfp24i5zPfCvcEhks9yN5d"],
      [
        "devnet-solana-lp-hexapool",
        "HHUt836dTXR8kxUGZUiK7sin6cxkf3U98YW2FYivKBcJ",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdc",
    displayName: "Polygon USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "FgurBCdyw9XhwXGUYR6qaT8eTXCMWDt3b58WW1FtVppa",
    authority: "69coJLCxruUbth3iNtzbwXcgyojKjKAVAFiTic49Fbgj",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-polygon-usdc",
    tokenAccounts: new Map([
      ["devnet-polygon-usdc", "7nLzo7TFJf41WBab5AuLCuAF7A9TRcvEQCPrzTjrnhG8"],
      [
        "devnet-solana-lp-hexapool",
        "8Bob5k8JvcuwhDkSeUT91BMM8JU2z36bdXeZR17aNaRo",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdt",
    displayName: "Polygon USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "7Epgp6xrmSsLFWXxwYwsmxYXz2mLxRT6bLvK4rYvrbTc",
    authority: "8cMYB4rFYMu5vm4Q9GM7ZskDkJ7anzdA4ETxcyua94K3",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-polygon-usdt",
    tokenAccounts: new Map([
      ["devnet-polygon-usdt", "G9fLWPVm5hNJ8yWhUd3uBPB1FYmK2MNqVPBT2qY4iqK7"],
      [
        "devnet-solana-lp-hexapool",
        "9McdiBTpZV7nYYa4Tv7411wetRxTakVb8XjzAFNohN9Y",
      ],
    ]),
  },
  {
    id: "gst-solana-bnb",
    displayName: "GST SPL - GST BEP20",
    isStakingPool: false,
    isStableSwap: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "DLg2DinrAnCjC5zxaoRzJHModVpEDNdnNVLE7VxPhfxe",
    authority: "AyQbRcdNn6khTJDqg1vEwb6jWQAVKcEbm4XmbFLW3k8",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-gst",
    tokenAccounts: new Map([
      ["devnet-bsc-gst", "D7YxhU2Q1qUJEVGfnvaU45mfkQJ5E5eurrMHGShYKciX"],
      ["devnet-solana-gst", "BpbTS7jLsiTiDjdNwAVxju8NmYgMwCacJKCLRnioLGxV"],
    ]),
  },
  {
    id: "gmt-solana-bnb",
    displayName: "GMT SPL - GMT BEP20",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "GZCwq7KwkoQjrUkVhpTkpLR3Epv4Vtn4j4FcuJUnhmhG",
    authority: "DvSxr48zvgGtCPEePzBz6R1eKo7xz1gkaE3YhqJm1JHV",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-gmt",
    tokenAccounts: new Map([
      ["devnet-bsc-gmt", "7WbJaS6tEXCxMqtiWJ7P7GkHLadskUJ2UzJJVv2qC3aP"],
      ["devnet-solana-gmt", "6gG1cPnypyNVN16cCHfbZoJ4GMXREvbxPTEQXakcZQiJ"],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Aurora),
    id: "meta-aurora-usdc",
    displayName: "Aurora USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "EzpaZeECVuVKh4dEZsdxqi2qtLiRN7Jm25Km4Cvqu2XE",
    authority: "BcQ67jPVrPTbZZ4xbgbDYkZynGcg1jUU198f1SzpuPcw",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-aurora-usdc",
    tokenAccounts: new Map([
      ["devnet-aurora-usdc", "yZABYQoCEgNCfktMaxgt3VfyKVK1WRi4A9BjkgnetPt"],
      [
        "devnet-solana-lp-hexapool",
        "EWs9XLKHEq4rDaWcfmA2W51jqTjLjR3PBXNJpcTGt64v",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Aurora),
    id: "meta-aurora-usdt",
    displayName: "Aurora USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "t6JAmJWDi4y6pp32p268ru3GrHEBXdoHERVqSjek3XY",
    authority: "ETywNpF1gsXmmPLSavw563Mr4FaCLmVxcupdWxPZ8nxw",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-aurora-usdt",
    tokenAccounts: new Map([
      ["devnet-aurora-usdt", "DpBhN9UoHh4RGGHcoGBfqeqKndstiTXup6pwhcBxXFFA"],
      [
        "devnet-solana-lp-hexapool",
        "Gmd1KvrLonD6pzeMz2U1nTJVgG4yv9LySpYQZVLV8eBm",
      ],
    ]),
  },
  {
    isDisabled: true, // TODO: Enable when deployed on devnet
    id: "meta-aurora-usn",
    displayName: "Aurora USN Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "11111111111111111111111111111111", // TODO: Update
    authority: "11111111111111111111111111111111", // TODO: Update
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-aurora-usn",
    tokenAccounts: new Map([
      ["devnet-aurora-usn", "11111111111111111111111111111111"], // TODO: Update
      [
        "devnet-solana-lp-hexapool",
        "11111111111111111111111111111111", // TODO: Update
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Fantom),
    id: "meta-fantom-usdc",
    displayName: "Fantom USDC Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "8EqXgUstAwEihJLcmeW8ojrSgbRbc2sWshnKpvDPKLiC",
    authority: "9RUzzifoTRPuJKSRzhNR92kDT7F3vT8Di57hDFdtU3Pu",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-fantom-usdc",
    tokenAccounts: new Map([
      ["devnet-fantom-usdc", "3DExDt8nzBWdHZTy9eNp6RPfSPD9MKpUnpPLcMGRbKPX"],
      [
        "devnet-solana-lp-hexapool",
        "EHbgKe7U33hh8CQpLUkNiZv6aGdvXosein74XN66h4Dt",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Karura),
    id: "meta-karura-ausd",
    displayName: "Karura AUSD Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "6ukUmzs2ZPokRXi8y3zbs3YvifcYZ6aZTmm3bpresupa",
    authority: "Gzgrhx5Z4DRL1daGcEXNzXw7LpMHUiVqEQG1jzoJ8GYE",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-karura-ausd",
    tokenAccounts: new Map([
      ["devnet-karura-ausd", "GMtr1h6yK3nFXUma2gW1tcf6wRoTg6dD4cRMWQRNiBcr"],
      [
        "devnet-solana-lp-hexapool",
        "t5Ze1g8r62wb3rhWxBuyw5t4ZFCE9815TW2kqbLBdGE",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Karura),
    id: "meta-karura-usdt",
    displayName: "Karura USDT Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "ELfBAsjAJbXoL6jmHNAK48ibrc85Z1DkzSg3WXEhgvxD",
    authority: "7NJJJt51JDXcKztQm24cvTHjBARz4PcmsFjdwXzy72nu",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-karura-usdt",
    tokenAccounts: new Map([
      ["devnet-karura-usdt", "83qeqo4SrVHGCzWny8m2bdHaMsGnv7te3mCSvueGzXJY"],
      [
        "devnet-solana-lp-hexapool",
        "Er4xHMADfjrjfDk798BoQNRBn4UrSTe93QK4Mx5mRHW4",
      ],
    ]),
  },
  {
    isDisabled: !isEcosystemEnabled(EcosystemId.Acala),
    id: "meta-acala-ausd",
    displayName: "Acala AUSD Meta-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "EU5P8s2UtDoAf32n5RLJTh7GXmdENy1WaeMbpxvPd4AH",
    authority: "3oKJcatorM1V9KeTKwasMC3NaAAzwbTfGaizpDKgeYGn",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-acala-ausd",
    tokenAccounts: new Map([
      ["devnet-acala-ausd", "Cki7zNJ8jLbwN7UeCwZTsuHVxRd8m3Y5fz4f5ioBNGFW"],
      [
        "devnet-solana-lp-hexapool",
        "CmbqCiQSJw2mN6pTMG5vUsX3MHiBVMj2bGo59JRsoojH",
      ],
    ]),
  },
  {
    id: "swimlake",
    displayName: "SwimLake",
    isStakingPool: true,
    isStableSwap: true,
    contract: "sWimoyG4uZiuHwVBp6ZCirB3cdqsHuoxDgs46X9jWMy",
    address: "7BZQBVZrneaEKkBTExncHm7p6NuF5MMiDmBNTot2CQc5",
    authority: "69PatS67furtMJVwUBqHoFdrn5nDTtxCGSSqEu2anSYX",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-swimlake",
    tokenAccounts: new Map([
      ["devnet-solana-swim", "GBjDaDLHQHDZ25gTygyLCaobgSXbTZ3WR9TVNoDqaicm"],
    ]),
  },
].filter((spec) => !spec.isDisabled);

const localnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
    isStableSwap: true,
    contract: "SwmGeiqX8avCodG8Bq7mbd4o5iMMfgGXoMAeECe5rmi",
    address: "PLSVJHkSe1wQgocGJx9d7KnfjXsPykq7cgLFHwXFRxV",
    authority: "3yRFKgKqAQBX3LaC5soLLsywua5FS7JCCWaJ5LQpnE2v",
    feeDecimals: 6,
    lpToken: "localnet-solana-lp-hexapool",
    tokenAccounts: new Map([
      ["localnet-solana-usdc", "TP19UrkLUihiEg3y98VjM8Gmh7GjWayucsbpyo195wC"],
      ["localnet-solana-usdt", "TP2gzosaKJNf5UjM8eWKKnN7Yni1uLbYJr88rvEvgPA"],
      ["localnet-ethereum-usdc", "TP3feUviS5XoqEpzz2d9iHhYip1wFaP7Zf4gmEXRVZ7"],
      ["localnet-ethereum-usdt", "TP4VVUhiHKBxzT6N3ThsivkHZtNtJTyx9HzYwLherjQ"],
      ["localnet-bsc-busd", "TP5Zu7nEzkif6zyz5pQaC3G9aPJ1PFSTfpvhQfDC2yr"],
      ["localnet-bsc-usdt", "TP6DaXSavPoCHKrKb5dcwtAkxM9b4Dwh4isd7fQ8hCb"],
    ]),
  },
  {
    id: "swimlake",
    displayName: "SwimLake",
    isStakingPool: true,
    isStableSwap: true,
    contract: "Sw1LeM87T6PEh3ydfc7PqRN3PG1RCFBGthUPSsPa3p5",
    address: "PLSupkMugKscXq7cGMEqKMVU66YdPaAH8AHohCNHasE",
    authority: "2VpHusCv5wWgcPLMreRqgCxSHpcdftgkjycsPVN5k2wg",
    feeDecimals: 6,
    lpToken: "localnet-solana-lp-swimlake",
    tokenAccounts: new Map([
      ["localnet-solana-swim", "TP8n5tqhUXVE3uGeKMT8tDMY5BJ8aNmbzuzFNCJqjLE"],
    ]),
  },
];

export const pools: ReadonlyRecord<Env, readonly PoolSpec[]> = {
  [Env.Mainnet]: mainnetPools,
  [Env.Devnet]: devnetPools,
  [Env.Localnet]: localnetPools,
  [Env.CustomLocalnet]: localnetPools,
};
