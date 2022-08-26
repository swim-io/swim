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

export enum EvmChainId {
  EthereumMainnet = 1,
  EthereumGoerli = 5,
  EthereumLocal = 1337,
  BnbMainnet = 56,
  BnbTestnet = 97,
  BnbLocal = 1397,
  PolygonMainnet = 137,
  PolygonTestnet = 80001,
  PolygonLocal = 80002, // TODO: This is a placeholder
  AvalancheMainnet = 43114, // C-Chain
  AvalancheTestnet = 43113,
  AvalancheLocal = 43112, // TODO: This is a placeholder
  AuroraMainnet = 1313161554,
  AuroraTestnet = 1313161555,
  AuroraLocal = 1313161556, // TODO: This is a placeholder
  FantomMainnet = 250,
  FantomTestnet = 4002,
  FantomLocal = 4003, // TODO: This is a placeholder
  KaruraMainnet = 686,
  KaruraTestnet = 596,
  KaruraLocal = 606, // TODO: This is a placeholder
  AcalaMainnet = 787,
  AcalaTestnet = 597,
  AcalaLocal = 607, // TODO: This is a placeholder
}

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
