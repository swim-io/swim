import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
  Tx,
} from "@swim-io/core";
import type { ethers } from "ethers";

export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export interface EvmPoolConfig extends PoolConfig {
  /** The Swim program ID */
  readonly contract: string;
  /**
   * Maps token IDs to addresses of token accounts owned by the pool
   */
  readonly tokenAccounts: ReadonlyMap<string, string>;
  readonly authority: string;
}

export interface EvmChainConfig extends ChainConfig {
  readonly pools: readonly EvmPoolConfig[];
}

export interface EvmEcosystemConfig extends EcosystemConfig {
  readonly protocol: EvmProtocol;
  readonly chains: ReadonlyMap<Env, EvmChainConfig>;
}

export interface EvmTx extends Tx {
  readonly response: ethers.providers.TransactionResponse;
  readonly receipt: ethers.providers.TransactionReceipt;
}
