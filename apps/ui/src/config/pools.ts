import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

export interface PoolSpec {
  readonly id: string;
  readonly displayName: string;
  readonly isStakingPool: boolean;
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
}

const mainnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
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
];

const devnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
    contract: "SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC",
    address: "B1SAcuHscDM6JozshK8mEWXGzpfVPeeFVkf98GRnoqiT",
    authority: "9DcGsnvKHCHurzXiQGtLD7n4ptPodD2ZzHMpQQWE9F8x",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-hexapool",
    tokenAccounts: new Map([
      ["devnet-ethereum-usdc", "9dgN9v64Vr7uFGWpmgWLEsPJMBkqED1xhesmGuT29hDe"],
      ["devnet-ethereum-usdt", "AriHJV8gDmrCMvUssWgs6zatJJQoW2Pz4sHVhd1svMDW"],
      ["devnet-bsc-busd", "E9x2dZgfwgvbDHtfMGpBPJJBwCVtF4dyUngNwHjz72Wc"],
      ["devnet-bsc-usdt", "FXqm2t5drgtxMjrQ1Vv32Y85nqnfdrLB2VWs2YNQZgAC"],
      ["devnet-solana-usdc", "46YZhENxGMxTssrrR2dhq3nyhkppT8CC2oLCbAFCkE6E"],
      ["devnet-solana-usdt", "2aVMEWxZo3q6xCxDLupdCxDvgNSrRA2NhmWtEGJR9inZ"],
    ]),
  },
  {
    id: "meta-avalanche-usdc",
    displayName: "Avalanche USDC Meta-Pool",
    isStakingPool: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "B5SxvSX5hEv3CJR8XMA6QnbiyZGsS7uhNdLimXVDn6PX",
    authority: "BbZwNqLypwU1Qqvnd6Bb7YJ1bYJj5VgMvwLv4NeqD8S",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-avalanche-usdc",
    tokenAccounts: new Map([
      ["devnet-avalanche-usdc", "ANWHgVyx7RZQnCUbAoEJKia6z2rRufEULcfQd6cZKDRw"],
      [
        "devnet-solana-lp-hexapool",
        "8E6dok36kNxGSgNnEkVbPgMswkH1tTN8H4QLe7GoKiUS",
      ],
    ]),
  },
  {
    id: "meta-avalanche-usdt",
    displayName: "Avalanche USDT Meta-Pool",
    isStakingPool: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "CrvWB1GsU6gsWys8rVsKirBVLicVsn7SMbcbuDejMhLn",
    authority: "CCjyGG6xQ5BpSaDneD6vdXCFjXwjmCbFWXNXF5NoBYo9",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-avalanche-usdt",
    tokenAccounts: new Map([
      ["devnet-avalanche-usdt", "3C46uzyHYNrx3ZBEsems32bXFUoh8B5G7PTrMMV2dLVr"],
      [
        "devnet-solana-lp-hexapool",
        "Hy8wggAcda4AjrRk21EWCeswgVSkGSo9ht68Roio9EqL",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdc",
    displayName: "Polygon USDC Meta-Pool",
    isStakingPool: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "AhAMrVeTYyS5EAhoYQvrL2Qd3sLHU4r3VgYZ6ChVAcW8",
    authority: "jieaZtSYb9FA7GzHHXxBakNuEVFZUQ7jRzR1dm2Gw4u",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-polygon-usdc",
    tokenAccounts: new Map([
      ["devnet-polygon-usdc", "a283NqFzprjMfq1cvJfuUk4dSFUMpVhS9gZdU7UcQ6h"],
      [
        "devnet-solana-lp-hexapool",
        "EKPywS7r4xECNf4zBG6xNcwyph5FdWeJ5ufJYGWZFKn9",
      ],
    ]),
  },
  {
    id: "meta-polygon-usdt",
    displayName: "Polygon USDT Meta-Pool",
    isStakingPool: false,
    contract: "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
    address: "4e5ZvtYTNEhuJUnLLqmQqPMMwTZmHWjXHJwf2H7x69Lz",
    authority: "EPzbYcoa1MMp324hmnsJM2C1f2GYHdHqKdtFMGYdswH6",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-meta-polygon-usdt",
    tokenAccounts: new Map([
      ["devnet-polygon-usdt", "E7bYM1UP51go1V8nJ5Miesp9BMwQNHTh5fQdHB4CrJ8q"],
      [
        "devnet-solana-lp-hexapool",
        "3N767DEwEynHvrWg32U9gwDqnP1f4RZZ5mxr8yeLHDp7",
      ],
    ]),
  },
  {
    id: "gst",
    displayName: "GST SPL - GST BEP20",
    isStakingPool: false,
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
    id: "gmt",
    displayName: "GMT SPL - GMT BEP20",
    isStakingPool: false,
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
    id: "swimlake",
    displayName: "SwimLake",
    isStakingPool: true,
    contract: "sWimoyG4uZiuHwVBp6ZCirB3cdqsHuoxDgs46X9jWMy",
    address: "7BZQBVZrneaEKkBTExncHm7p6NuF5MMiDmBNTot2CQc5",
    authority: "69PatS67furtMJVwUBqHoFdrn5nDTtxCGSSqEu2anSYX",
    feeDecimals: 6,
    lpToken: "devnet-solana-lp-swimlake",
    tokenAccounts: new Map([
      ["devnet-solana-swim", "GBjDaDLHQHDZ25gTygyLCaobgSXbTZ3WR9TVNoDqaicm"],
    ]),
  },
];

const localnetPools: readonly PoolSpec[] = [
  {
    id: "hexapool",
    displayName: "Stablecoin Hexa-Pool",
    isStakingPool: false,
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
