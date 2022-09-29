import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
} from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

export type AptosProtocol = "aptos-protocol";
export const APTOS_PROTOCOL: AptosProtocol = "aptos-protocol";

export type AptosEcosystemId = "aptos";
export const APTOS_ECOSYSTEM_ID: AptosEcosystemId = "aptos";

export interface AptosPoolConfig extends PoolConfig {
  readonly ecosystemId: AptosEcosystemId;
}

export interface AptosChainConfig extends ChainConfig {
  readonly pools: readonly AptosPoolConfig[];
}

export interface AptosEcosystemConfig extends EcosystemConfig {
  readonly id: AptosEcosystemId;
  readonly protocol: AptosProtocol;
  readonly chains: Partial<ReadonlyRecord<Env, AptosChainConfig>>;
}
