import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type { SolanaChainConfig, SolanaEcosystemConfig } from "./protocol";
import { SOLANA_ECOSYSTEM_ID, SOLANA_PROTOCOL } from "./protocol";

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
    },
    {
      id: "mainnet-solana-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        decimals: 6,
      },
    },
    {
      id: "mainnet-solana-gst",
      projectId: TokenProjectId.Gst,
      nativeDetails: {
        address: "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
        decimals: 9,
      },
    },
    {
      id: "mainnet-solana-gmt",
      projectId: TokenProjectId.Gmt,
      nativeDetails: {
        address: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",
        decimals: 9,
      },
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
    },
    {
      id: "testnet-solana-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "8VbikoRxEoyYzTDzDcPTSsGk2E5mM7fK1WrVpKrVd75M",
        decimals: 6,
      },
    },
    {
      id: "testnet-solana-gst",
      projectId: TokenProjectId.Gst,
      nativeDetails: {
        address: "FYxTtPiGxNSDouZQftVRHFqraFJyLvNbTXzZj8X2gKQP",
        decimals: 9,
      },
    },
    {
      id: "testnet-solana-gmt",
      projectId: TokenProjectId.Gmt,
      nativeDetails: {
        address: "3xsNPBpf7UAKpJsLTqiPqHT3ZBKPDndj1rJFM7xaSJcV",
        decimals: 9,
      },
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
    },
    {
      id: "local-solana-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23",
        decimals: 6,
      },
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
