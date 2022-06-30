import type { ChainSpec, EcosystemSpec } from "./base";
import { Env } from "./base";

/** Adapted from @solana/spl-token-registry ENV */
export const enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export interface SolanaChainSpec extends ChainSpec {
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  readonly endpoint: string;
  readonly wsEndpoint: string;
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export interface SolanaEcosystemSpec extends EcosystemSpec {
  readonly chainSpecs: readonly SolanaChainSpec[];
}

export const PRESETS: ReadonlyMap<Env, SolanaChainSpec> = new Map([
  [
    Env.Mainnet,
    {
      env: Env.Mainnet,
      chainId: SolanaChainId.MainnetBeta,
      wormhole: {
        bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
        tokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      },
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
      wormhole: {
        bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
        tokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      },
      endpoint: "https://api.devnet.solana.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    },
  ],
]);

const createEcosystemConfig = (
  chainSpecs: readonly SolanaChainSpec[],
): EcosystemSpec => ({
  id: "solana" as const,
  protocol: "solana-protocol" as const,
  wormholeChainId: 1 as const,
  displayName: "Solana",
  nativeTokenSymbol: "SOL",
  chainSpecs,
});

export default createEcosystemConfig;
