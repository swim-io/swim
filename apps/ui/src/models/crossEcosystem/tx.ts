import type solana from "@solana/web3.js";
import type { ethers } from "ethers";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { deduplicate } from "../../utils";

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

export interface BscTx extends EvmTx {
  readonly ecosystem: EcosystemId.Bsc;
}

export interface AvalancheTx extends EvmTx {
  readonly ecosystem: EcosystemId.Avalanche;
}

export interface PolygonTx extends EvmTx {
  readonly ecosystem: EcosystemId.Polygon;
}

export type Tx = SolanaTx | EvmTx;

export type TxsByPoolId = ReadonlyRecord<
  string,
  readonly SolanaTx[] | undefined
>;

export interface TxWithPoolId {
  readonly poolId: string;
  readonly tx: SolanaTx;
}

export type TxsByTokenId = ReadonlyRecord<string, readonly Tx[] | undefined>;

export interface TxWithTokenId<T extends Tx = Tx> {
  readonly tokenId: string;
  readonly tx: T;
}

export const isSolanaTx = (tx: Tx): tx is SolanaTx =>
  tx.ecosystem === EcosystemId.Solana;

export const isEthereumTx = (tx: Tx): tx is EthereumTx =>
  tx.ecosystem === EcosystemId.Ethereum;

export const isBscTx = (tx: Tx): tx is BscTx =>
  tx.ecosystem === EcosystemId.Bsc;

export const isAvalancheTx = (tx: Tx): tx is AvalancheTx =>
  tx.ecosystem === EcosystemId.Avalanche;

export const isPolygonTx = (tx: Tx): tx is PolygonTx =>
  tx.ecosystem === EcosystemId.Polygon;

export const isEvmTx = (tx: Tx): tx is EvmTx =>
  isEthereumTx(tx) || isBscTx(tx) || isAvalancheTx(tx) || isPolygonTx(tx);

export const groupTxsByTokenId = (
  txs: readonly TxWithTokenId[],
): TxsByTokenId =>
  txs.reduce<TxsByTokenId>(
    (
      accumulator: TxsByTokenId,
      { tokenId, tx }: TxWithTokenId,
    ): TxsByTokenId => ({
      ...accumulator,
      [tokenId]: [...(accumulator[tokenId] ?? []), tx],
    }),
    {},
  );

export const groupTxsByPoolId = (txs: readonly TxWithPoolId[]): TxsByPoolId =>
  txs.reduce<TxsByPoolId>(
    (accumulator: TxsByPoolId, { poolId, tx }: TxWithPoolId): TxsByPoolId => ({
      ...accumulator,
      [poolId]: [...(accumulator[poolId] ?? []), tx],
    }),
    {},
  );

export const deduplicateTxs = <T extends Tx = Tx>(
  txs: readonly T[],
): readonly T[] => deduplicate<string, T>((tx) => tx.txId, txs);

export const deduplicateTxsByTokenId = (
  oldTxsByTxId: TxsByTokenId,
  newTxsByTxId: TxsByTokenId,
): TxsByTokenId =>
  Object.entries(newTxsByTxId).reduce((accumulator, [tokenId, newTxs]) => {
    if (newTxs === undefined) {
      return accumulator;
    }
    const txsToAdd = newTxs.filter((newTx) => {
      const txsForToken = accumulator[tokenId];
      return (
        txsForToken === undefined ||
        txsForToken.every((tx) => tx.txId !== newTx.txId)
      );
    });
    return {
      ...accumulator,
      [tokenId]: [...(accumulator[tokenId] ?? []), ...txsToAdd],
    };
  }, oldTxsByTxId);
