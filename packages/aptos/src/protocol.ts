import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
  Tx,
} from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { Types } from "aptos";

export type AptosProtocol = "aptos-protocol";
export const APTOS_PROTOCOL: AptosProtocol = "aptos-protocol";

export type AptosEcosystemId = "aptos";
export const APTOS_ECOSYSTEM_ID: AptosEcosystemId = "aptos";

export interface AptosPoolConfig extends PoolConfig {
  readonly ecosystemId: AptosEcosystemId;
  readonly resourceType: Types.MoveStructTag;
}

export interface AptosChainConfig extends ChainConfig {
  readonly pools: readonly AptosPoolConfig[];
}

export interface AptosEcosystemConfig extends EcosystemConfig {
  readonly id: AptosEcosystemId;
  readonly protocol: AptosProtocol;
  readonly chains: Partial<ReadonlyRecord<Env, AptosChainConfig>>;
}

export interface AptosTx extends Tx {
  readonly ecosystemId: AptosEcosystemId;
}

export const isAptosTx = (tx: Tx): tx is AptosTx =>
  tx.ecosystemId === APTOS_ECOSYSTEM_ID;
