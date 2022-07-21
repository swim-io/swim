import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  Tx,
} from "@swim-io/core-types";

export type SolanaProtocol = "solana-protocol";
export const SOLANA_PROTOCOL: SolanaProtocol = "solana-protocol";

export interface SolanaChainConfig extends ChainConfig {
  readonly endpoint: string;
  readonly wsEndpoint: string;
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export interface SolanaEcosystemConfig extends EcosystemConfig {
  readonly chains: ReadonlyMap<Env, SolanaChainConfig>;
}

export interface SolanaTx extends Tx {
  readonly parsedTx: ParsedTransactionWithMeta;
}
