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

export interface EvmPoolConfig<E extends EvmEcosystemId = EvmEcosystemId>
  extends PoolConfig {
  readonly ecosystemId: E;
}

export interface EvmChainConfig<E extends EvmEcosystemId = EvmEcosystemId>
  extends ChainConfig {
  readonly pools: readonly EvmPoolConfig<E>[];
}

export interface EvmEcosystemConfig<E extends EvmEcosystemId = EvmEcosystemId>
  extends EcosystemConfig {
  readonly id: E;
  readonly protocol: EvmProtocol;
  readonly chains: Partial<ReadonlyRecord<Env, EvmChainConfig<E>>>;
}

export enum EvmTxType {
  Erc20Approve = "erc20:approve",
  PortalTransferTokens = "portal:transferTokens",
  PortalCompleteTransfer = "portal:completeTransfer",
}

export type EvmTx = Tx<ethers.providers.TransactionReceipt, EvmEcosystemId>;

export const isEvmTx = (tx: Tx<any>): tx is EvmTx =>
  isEvmEcosystemId(tx.ecosystemId);
