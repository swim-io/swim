import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  PoolConfig,
  Tx,
} from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { ethers } from "ethers";

export type EvmChainIdByEnv = Partial<ReadonlyRecord<Env, number>>;

export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export enum EvmEcosystemId {
  Ethereum = "ethereum",
  Bnb = "bnb",
  Avalanche = "avalanche",
  Polygon = "polygon",
  Aurora = "aurora",
  Fantom = "fantom",
  Karura = "karura",
  Acala = "acala",
}

export const isEvmEcosystemId = (
  ecosystemId: string,
): ecosystemId is EvmEcosystemId =>
  Object.values<string>(EvmEcosystemId).includes(ecosystemId);

export interface EvmPoolConfig<E extends EvmEcosystemId> extends PoolConfig {
  readonly ecosystemId: E;
}

export interface EvmChainConfig<E extends EvmEcosystemId> extends ChainConfig {
  readonly pools: readonly EvmPoolConfig<E>[];
}

export interface EvmEcosystemConfig<E extends EvmEcosystemId>
  extends EcosystemConfig {
  readonly id: E;
  readonly protocol: EvmProtocol;
  readonly chains: ReadonlyMap<Env, EvmChainConfig<E>>;
}

export interface EvmTx extends Tx {
  readonly ecosystemId: EvmEcosystemId;
  readonly response: ethers.providers.TransactionResponse;
  readonly receipt: ethers.providers.TransactionReceipt;
}

export const isEvmTx = (tx: Tx): tx is EvmTx =>
  isEvmEcosystemId(tx.ecosystemId);
