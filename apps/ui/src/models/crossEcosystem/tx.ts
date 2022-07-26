import type solana from "@solana/web3.js";
import type { ReadonlyRecord } from "@swim-io/utils";
import type { ethers } from "ethers";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";

interface BaseTx {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
}

export interface SolanaTx extends BaseTx {
  readonly ecosystem: EcosystemId.Solana;
  readonly parsedTx: solana.ParsedTransactionWithMeta;
}

export interface EvmTx extends BaseTx {
  readonly ecosystem: EvmEcosystemId;
  readonly txResponse: ethers.providers.TransactionResponse;
  readonly txReceipt: ethers.providers.TransactionReceipt;
}

export interface EthereumTx extends EvmTx {
  readonly ecosystem: EcosystemId.Ethereum;
}

export interface BnbTx extends EvmTx {
  readonly ecosystem: EcosystemId.Bnb;
}

export interface AvalancheTx extends EvmTx {
  readonly ecosystem: EcosystemId.Avalanche;
}

export interface PolygonTx extends EvmTx {
  readonly ecosystem: EcosystemId.Polygon;
}

export interface AuroraTx extends EvmTx {
  readonly ecosystem: EcosystemId.Aurora;
}

export interface FantomTx extends EvmTx {
  readonly ecosystem: EcosystemId.Fantom;
}

export interface KaruraTx extends EvmTx {
  readonly ecosystem: EcosystemId.Karura;
}

export interface AcalaTx extends EvmTx {
  readonly ecosystem: EcosystemId.Acala;
}

export type Tx = SolanaTx | EvmTx;

export type TxsByTokenId = ReadonlyRecord<string, readonly Tx[] | undefined>;

export interface TxWithTokenId<T extends Tx = Tx> {
  readonly tokenId: string;
  readonly tx: T;
}

export const isSolanaTx = (tx: Tx): tx is SolanaTx =>
  tx.ecosystem === EcosystemId.Solana;

export const isEthereumTx = (tx: Tx): tx is EthereumTx =>
  tx.ecosystem === EcosystemId.Ethereum;

export const isBnbTx = (tx: Tx): tx is BnbTx =>
  tx.ecosystem === EcosystemId.Bnb;

export const isAvalancheTx = (tx: Tx): tx is AvalancheTx =>
  tx.ecosystem === EcosystemId.Avalanche;

export const isPolygonTx = (tx: Tx): tx is PolygonTx =>
  tx.ecosystem === EcosystemId.Polygon;

export const isAuroraTx = (tx: Tx): tx is AuroraTx =>
  tx.ecosystem === EcosystemId.Aurora;

export const isFantomTx = (tx: Tx): tx is FantomTx =>
  tx.ecosystem === EcosystemId.Fantom;

export const isKaruraTx = (tx: Tx): tx is KaruraTx =>
  tx.ecosystem === EcosystemId.Karura;

export const isAcalaTx = (tx: Tx): tx is AcalaTx =>
  tx.ecosystem === EcosystemId.Acala;

export const isEvmTx = (tx: Tx): tx is EvmTx => isEvmEcosystemId(tx.ecosystem);
