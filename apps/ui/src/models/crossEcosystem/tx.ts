import type solana from "@solana/web3.js";
import type { Tx as BaseTx } from "@swim-io/core";
import type { ethers } from "ethers";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";

export interface SolanaTx extends BaseTx {
  readonly ecosystemId: EcosystemId.Solana;
  readonly parsedTx: solana.ParsedTransactionWithMeta;
}

export interface EvmTx extends BaseTx {
  readonly ecosystemId: EvmEcosystemId;
  readonly txResponse: ethers.providers.TransactionResponse;
  readonly txReceipt: ethers.providers.TransactionReceipt;
}

export type Tx = SolanaTx | EvmTx;

export type TxsByTokenId = ReadonlyRecord<string, readonly Tx[] | undefined>;

export interface TxWithTokenId<T extends Tx = Tx> {
  readonly tokenId: string;
  readonly tx: T;
}

export const isSolanaTx = (tx: Tx): tx is SolanaTx =>
  tx.ecosystemId === EcosystemId.Solana;

export const isEvmTx = (tx: Tx): tx is EvmTx =>
  isEvmEcosystemId(tx.ecosystemId);
