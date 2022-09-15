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
  swimUsdDetails: {
    address: "BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1",
    decimals: 8,
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
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
    address: "5ctnNpb7h1SyPqZ8t8m2kCykrtDGVZBtZgYWv6UAeDhr",
    decimals: 8,
  },
  routingContractAddress: "", // TODO: add when deployed
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
  swimUsdDetails: {
    address: "LPTufpWWSucDqq1hib8vxj1uJxTh2bkE7ZTo65LH4J2",
    decimals: 8,
  },
  routingContractAddress: "", // TODO: add when deployed
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
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
