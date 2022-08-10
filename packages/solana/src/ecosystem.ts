import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";

import type { SolanaChainConfig, SolanaEcosystemConfig } from "./protocol";
import { SOLANA_PROTOCOL } from "./protocol";

const SOLANA_ECOSYSTEM_ID = "solana";

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
  endpoints: ["https://solana-api.projectserum.com"],
  tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
  tokens: [
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
          "ethereum",
          {
            address: "0x41f7B8b9b897276b7AAE926a9016935280b44E97",
            decimals: 6,
          },
        ],
        [
          "bnb",
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
          "ethereum",
          {
            address: "0x1CDD2EaB61112697626F7b4bB0e23Da4FeBF7B7C",
            decimals: 6,
          },
        ],
        [
          "bnb",
          {
            address: "0x49d5cC521F75e13fa8eb4E89E9D381352C897c96",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-solana-swimusd",
      projectId: TokenProjectId.SwimUsd,
      nativeEcosystemId: SOLANA_ECOSYSTEM_ID,
      nativeDetails: {
        address: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
        decimals: 8,
      },
      wrappedDetails: new Map(),
    },
  ],
  pools: [
    {
      id: "mainnet-solana-usdc-usdt",
      displayName: "Solana USDC USDT",
      isStakingPool: false,
      isStableSwap: true,
      isLegacyPool: false,
      contract: "11111111111111111111111111111111", // TODO: Update
      address: "11111111111111111111111111111111", // TODO: Update
      authority: "11111111111111111111111111111111", // TODO: Update
      feeDecimals: 6,
      lpTokenId: "mainnet-swimusd",
      tokenIds: ["mainnet-solana-usdc", "mainnet-solana-usdt"],
      tokenAccounts: new Map([
        ["mainnet-solana-usdc", "11111111111111111111111111111111"], // TODO: Update
        ["mainnet-solana-usdt", "11111111111111111111111111111111"], // TODO: Update
      ]),
    },
  ],
};

const devnet: SolanaChainConfig = {
  name: "Solana Devnet",
  chainId: SolanaChainId.Devnet,
  wormhole: {
    bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
    portal: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  },
  endpoints: ["https://api.devnet.solana.com"],
  tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
  tokens: [],
  pools: [],
};

const localnet: SolanaChainConfig = {
  name: "Solana Localnet",
  chainId: SolanaChainId.Localnet,
  wormhole: {
    bridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
    portal: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
  },
  endpoints: ["http://127.0.0.1:8899"],
  tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  otterTotCollection: "", // TODO: Deploy on localnet
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, SolanaChainConfig> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
  [Env.Local, localnet],
]);

const gasToken: GasToken = {
  name: "sol",
  symbol: "SOL",
  decimals: 9,
};

export const solana: SolanaEcosystemConfig = {
  id: SOLANA_ECOSYSTEM_ID,
  protocol: SOLANA_PROTOCOL,
  wormholeChainId: 1,
  displayName: "Solana",
  gasToken,
  chains,
};
