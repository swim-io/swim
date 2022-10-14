import type { GasToken, TokenDetails } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type { SolanaChainConfig, SolanaEcosystemConfig } from "./protocol";
import { SOLANA_ECOSYSTEM_ID, SOLANA_PROTOCOL } from "./protocol";

const EMPTY_MAP: ReadonlyMap<string, TokenDetails> = new Map();
const BNB_ECOSYSTEM_ID = "bnb";
const ETHEREUM_ECOSYSTEM_ID = "ethereum";

/** Adapted from @solana/spl-token-registry ENV */
export enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

const mainnet: SolanaChainConfig = {
  name: "Solana Mainnet Beta",
  chainId: SolanaChainId.MainnetBeta,
  wormhole: {
    bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
    portal: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
  },
  publicRpcUrls: ["https://solana-api.projectserum.com"],
  swimUsdDetails: {
    address: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
    decimals: 8,
  },
  routingContractAddress: "", // TODO: Add when deployed
  routingContractStateAddress: "", // TODO: Add when deployed
  twoPoolContractAddress: "", // TODO: Add when deployed
  tokens: [
    {
      id: "mainnet-solana-usdc",
      projectId: TokenProjectId.Usdc,
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
      projectId: TokenProjectId.Usdt,
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
      projectId: TokenProjectId.Gst,
      nativeDetails: {
        address: "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-gmt",
      projectId: TokenProjectId.Gmt,
      nativeDetails: {
        address: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-hexapool",
      projectId: TokenProjectId.SwimUsd,
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
      projectId: TokenProjectId.SwimAvalancheUsdcLp,
      nativeDetails: {
        address: "DKwsWeqHrB8R1u2DFMHKtq4iqaQNgPgUbHTJyXPqkTzK",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-avalanche-usdt",
      projectId: TokenProjectId.SwimAvalancheUsdtLp,
      nativeDetails: {
        address: "5rwvDmUbcnZTwZ4Zywev2wnDbyDDD2vcsGU2Xmy7aRNS",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-polygon-usdc",
      projectId: TokenProjectId.SwimPolygonUsdcLp,
      nativeDetails: {
        address: "ANFojEXhiEQQoovhBs77XmBQuqbe59UBygRWViyf4945",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-polygon-usdt",
      projectId: TokenProjectId.SwimPolygonUsdtLp,
      nativeDetails: {
        address: "2Nx6L79dHHgHcJtNfZWukQkWZvf5h4bps34zuh1gjtdP",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-gst",
      projectId: TokenProjectId.SwimSolanaGstBinanceGstLp,
      nativeDetails: {
        address: "8YYBkTNhpY9mFdCdZWM6mHNf8J6A9hGfimb33LEiiZ3x",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-gmt",
      projectId: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
      nativeDetails: {
        address: "2x7MjgopLXd3qETGLpY19cyZjHvVnGkrwVjTkJnBza4A",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-aurora-usdc",
      projectId: TokenProjectId.SwimAuroraUsdcLp,
      nativeDetails: {
        address: "9qRe2nBrR2rTXxRaV1PZN9hZnqq3UXgoFWTbP6NE3MEu",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-aurora-usdt",
      projectId: TokenProjectId.SwimAuroraUsdtLp,
      nativeDetails: {
        address: "4XPDxtGbcM7bAPKZxALd2s862n3WoG4xPPvyCPVULKAb",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-aurora-usn",
      projectId: TokenProjectId.SwimAuroraUsnLp,
      nativeDetails: {
        address: "3eXCU7YoiCq3rZ6787pPFJE7TXBsKuTZ49wH2kFnuTeF",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-fantom-usdc",
      projectId: TokenProjectId.SwimFantomUsdcLp,
      nativeDetails: {
        address: "J5ifGexAQTg76TresJhJSqTPJLT6BNxrV5rwNJTTz4Cx",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-karura-ausd",
      projectId: TokenProjectId.SwimKaruraAusdLp,
      nativeDetails: {
        address: "8vzXSNVAX4fymEFahJFh1ypzDBFv3QMVaZ4GtJWHrRjU",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-karura-usdt",
      projectId: TokenProjectId.SwimKaruraUsdtLp,
      nativeDetails: {
        address: "2sXvitirRSjgTTNzGNWAFZWSqEx87kDoTJvqG9JSyivh",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-meta-acala-ausd",
      projectId: TokenProjectId.SwimAcalaAusdLp,
      nativeDetails: {
        address: "11111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-swim",
      projectId: TokenProjectId.Swim,
      nativeDetails: {
        address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "mainnet-solana-lp-swimlake",
      projectId: TokenProjectId.XSwim,
      nativeDetails: {
        address: "SwiMNJ49SxkqMaVWLGGVRH25kE5dBnD2RQoiQUnKtMC",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [],
};

const testnet: SolanaChainConfig = {
  name: "Solana Devnet",
  chainId: SolanaChainId.Devnet,
  wormhole: {
    bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
    portal: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  },
  publicRpcUrls: ["https://api.devnet.solana.com"],
  swimUsdDetails: {
    address: "3ngTtoyP9GFybFifX1dr7gCFXFiM2Wr6NfXn6EuU7k6C",
    decimals: 6,
  },
  routingContractAddress: "9z6G41AyXk73r1E4nTv81drQPtEqupCSAnsLdGV5WGfK", // TODO: Update if necessary
  routingContractStateAddress: "Dzx6CofYZQwJrvLctW9vbnNJX4ViqFoTV7bjcrWxUbwY", // TODO: Update if necessary
  twoPoolContractAddress: "8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM",
  tokens: [
    {
      id: "testnet-solana-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "6iSRgpK4oiqJZuhpLsTecW3n9xBKUq9N3VPQN7RinYwq",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "8VbikoRxEoyYzTDzDcPTSsGk2E5mM7fK1WrVpKrVd75M",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-gst",
      projectId: TokenProjectId.Gst,
      nativeDetails: {
        address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-gmt",
      projectId: TokenProjectId.Gmt,
      nativeDetails: {
        address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-hexapool",
      projectId: TokenProjectId.SwimUsd,
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
      projectId: TokenProjectId.Swim,
      nativeDetails: {
        address: "swimnKEr963p7EbCjsSnBCoYwytuZHPm3zbq6fKLHXb",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-swimlake",
      projectId: TokenProjectId.XSwim,
      nativeDetails: {
        address: "A8UVBwvj1XcdP5okoMqkjhCQGLaqQ8iJDYnNxAMbsNNF",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-avalanche-usdc",
      projectId: TokenProjectId.SwimAvalancheUsdcLp,
      nativeDetails: {
        address: "DU15RXzuPWTLC4tbAcQvtXbDkHFrY8u6CxgTdhz2Mt8c",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-avalanche-usdt",
      projectId: TokenProjectId.SwimAvalancheUsdtLp,
      nativeDetails: {
        address: "D6PuZckpEcBhVcpfgjgbWnARhFD3ApHhvnxBGWR6MW5Z",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-polygon-usdc",
      projectId: TokenProjectId.SwimPolygonUsdcLp,
      nativeDetails: {
        address: "6WBFbyA3XJ3T2BeqA9JbyZFfj3KTCRtnC8MJANBsVNrz",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-polygon-usdt",
      projectId: TokenProjectId.SwimPolygonUsdtLp,
      nativeDetails: {
        address: "HH3RwS94BWhR4bKeNYGvr2CfSLRQ2Kq6EYSDTKgGLgET",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-gst",
      projectId: TokenProjectId.SwimSolanaGstBinanceGstLp,
      nativeDetails: {
        address: "BM3sXSfRg1yKzf2AbTA5QV76MdnKHi9M8D7VCGzDEYM1",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-gmt",
      projectId: TokenProjectId.SwimSolanaGmtBinanceGmtLp,
      nativeDetails: {
        address: "5VUZL2JcvbmjuT1DzDyWJ4mwtEH8unKyuQj3k38j8Ngs",
        decimals: 9,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-aurora-usdc",
      projectId: TokenProjectId.SwimAuroraUsdcLp,
      nativeDetails: {
        address: "AQiHPuuBPsq4MLLjLv2WHRFbrNB1JHZeR4mQGVJTwVHn",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-aurora-usdt",
      projectId: TokenProjectId.SwimAuroraUsdtLp,
      nativeDetails: {
        address: "utXdXdUMaS5qrBDDUg5btQMGL2CedouzmMPbYMJPEZD",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-aurora-usn",
      projectId: TokenProjectId.SwimAuroraUsnLp,
      nativeDetails: {
        address: "11111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-fantom-usdc",
      projectId: TokenProjectId.SwimFantomUsdcLp,
      nativeDetails: {
        address: "4hmRgsk3hSdK1gXV7rg1pStwYtntKmbcFQyKqsZ4USis",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-karura-ausd",
      projectId: TokenProjectId.SwimKaruraAusdLp,
      nativeDetails: {
        address: "4idDPnTYR4J9YhXmayKZYW8QBrASuuiTAxfkWUeaL3ap",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-karura-usdt",
      projectId: TokenProjectId.SwimKaruraUsdtLp,
      nativeDetails: {
        address: "882uzB9euTbBQJ6MrGrvxjXSTQi23VBQZcLcTH4E5Xow",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "testnet-solana-lp-meta-acala-ausd",
      projectId: TokenProjectId.SwimAcalaAusdLp,
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

const localnet: SolanaChainConfig = {
  name: "Solana Localnet",
  chainId: SolanaChainId.Localnet,
  wormhole: {
    bridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
    portal: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
  },
  publicRpcUrls: ["http://127.0.0.1:8899"],
  swimUsdDetails: {
    address: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
    decimals: 8,
  },
  routingContractAddress: "", // TODO: Add when deployed
  routingContractStateAddress: "", // TODO: Add when deployed
  twoPoolContractAddress: "", // TODO: Add when deployed
  tokens: [
    {
      id: "local-solana-usdc",
      projectId: TokenProjectId.Usdc,
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
      projectId: TokenProjectId.Usdt,
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
      projectId: TokenProjectId.SwimUsd,
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
      projectId: TokenProjectId.Swim,
      nativeDetails: {
        address: "SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g",
        decimals: 6,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      id: "local-solana-lp-swimlake",
      projectId: TokenProjectId.XSwim,
      nativeDetails: {
        address: "xSwy12tTsuYwM2Hd7ceNmvDftgxJ2ZSTycjzAfrNwPW",
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [],
};

const gasToken: GasToken = {
  name: "sol",
  symbol: "SOL",
  decimals: 9,
};

export const solana = assertType<SolanaEcosystemConfig>()({
  id: SOLANA_ECOSYSTEM_ID,
  protocol: SOLANA_PROTOCOL,
  wormholeChainId: 1,
  displayName: "Solana",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
