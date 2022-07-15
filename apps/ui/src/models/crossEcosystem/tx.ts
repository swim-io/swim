import type solana from "@solana/web3.js";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type { ethers } from "ethers";

import type {
  EcosystemId,
  EvmEcosystemId,
  SolanaEcosystemId,
} from "../../config";
import { isEvmEcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";

interface BaseTx {
  readonly ecosystem: EcosystemId;
  readonly txId: string;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
}

export interface SolanaTx extends BaseTx {
  readonly ecosystem: SolanaEcosystemId;
  readonly parsedTx: solana.ParsedTransactionWithMeta;
}

export interface EvmTx extends BaseTx {
  readonly ecosystem: EvmEcosystemId;
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
  tx.ecosystem === SOLANA_ECOSYSTEM_ID;

export const isEvmTx = (tx: Tx): tx is EvmTx => isEvmEcosystemId(tx.ecosystem);
