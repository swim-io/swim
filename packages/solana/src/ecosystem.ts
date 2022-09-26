import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
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
  tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
  tokens: [],
  pools: [],
};

const devnet: SolanaChainConfig = {
  name: "Solana Devnet",
  chainId: SolanaChainId.Devnet,
  wormhole: {
    bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
    portal: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  },
  publicRpcUrls: ["https://api.devnet.solana.com"],
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
  publicRpcUrls: ["http://127.0.0.1:8899"],
  tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  otterTotCollection: "", // TODO: Deploy on localnet
  tokens: [],
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
    [Env.Devnet]: devnet,
    [Env.Local]: localnet,
  },
} as const);
