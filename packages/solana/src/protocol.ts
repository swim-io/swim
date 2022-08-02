import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
  Tx,
} from "@swim-io/core";

export type SolanaProtocol = "solana-protocol";
export const SOLANA_PROTOCOL: SolanaProtocol = "solana-protocol";

export interface SolanaPoolConfig extends PoolConfig {
  /** The Swim program ID */
  readonly contract: string;
  /**
   * Maps token IDs to addresses of token accounts owned by the pool
   */
  readonly tokenAccounts: ReadonlyMap<string, string>;
  readonly authority: string;
}

export interface SolanaChainConfig extends ChainConfig {
  readonly pools: readonly SolanaPoolConfig[];
  readonly endpoints: readonly string[];
  readonly wsEndpoints: readonly string[];
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export interface SolanaEcosystemConfig extends EcosystemConfig {
  readonly chains: ReadonlyMap<Env, SolanaChainConfig>;
}

export interface SolanaTx extends Tx {
  readonly parsedTx: ParsedTransactionWithMeta;
}
