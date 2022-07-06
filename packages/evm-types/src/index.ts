import type { ChainConfig, EcosystemConfig } from "@swim-io/core-types";

export interface EvmChainConfig extends ChainConfig {
  readonly ecosystem: string,
  /** This should be unique for a given Env */
  readonly chainId: number;
  readonly chainName: string;
  readonly rpcUrls: readonly string[];
}

export interface EvmEcosystemConfig extends EcosystemConfig {
  readonly chains: readonly EvmChainConfig[];
}

export const EVM_PROTOCOL = "evm" as const;
