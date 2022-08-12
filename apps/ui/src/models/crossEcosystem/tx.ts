import type { EvmTx as BaseEvmTx } from "@swim-io/evm";
import type { SolanaTx as BaseSolanaTx } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";

export interface SolanaTx extends BaseSolanaTx {
  readonly ecosystemId: EcosystemId.Solana;
}

export interface EvmTx extends BaseEvmTx {
  readonly ecosystemId: EvmEcosystemId;
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
