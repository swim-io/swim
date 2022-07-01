import type { ChainConfig, EcosystemConfig } from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";

/** Adapted from @solana/spl-token-registry ENV */
export const enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export interface SolanaChainConfig extends ChainConfig {
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  readonly endpoint: string;
  readonly wsEndpoint: string;
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export interface SolanaEcosystemConfig extends EcosystemConfig {
  readonly chains: readonly SolanaChainConfig[];
}

export const PRESETS: ReadonlyMap<Env, SolanaChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      env: Env.Mainnet,
      chainId: SolanaChainId.MainnetBeta,
      wormholeBridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
      wormholeTokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      endpoint: "https://solana-api.projectserum.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
    },
  ],
  [
    Env.Devnet,
    {
      env: Env.Devnet,
      chainId: SolanaChainId.Devnet,
      wormholeBridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
      wormholeTokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      endpoint: "https://api.devnet.solana.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    },
  ],
]);

export const createEcosystemConfig = (
  chains: readonly SolanaChainConfig[],
): SolanaEcosystemConfig => ({
  id: "solana" as const,
  protocol: "solana-protocol" as const,
  wormholeChainId: 1 as const,
  displayName: "Solana",
  gasToken: {
    name: "sol",
    symbol: "SOL",
    decimals: 9,
  },
  chains,
});
