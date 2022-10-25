import type {
  ParsedTransactionWithMeta,
  TransactionBlockhashCtor,
} from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

import type { SolanaTx } from "../protocol";
import { SOLANA_ECOSYSTEM_ID } from "../protocol";

export type CreateTxOptions = Omit<
  TransactionBlockhashCtor,
  "blockhash" | "lastValidBlockHeight"
>;

/** Create transaction with dummy blockhash and lastValidBlockHeight, expected to be overwritten by solanaClient.sendAndConfirmTx to prevent expired blockhash */
export const createTx = (opts: CreateTxOptions): Transaction =>
  new Transaction({ ...opts, blockhash: "", lastValidBlockHeight: 0 });

export const parsedTxToSolanaTx = (
  parsedTx: ParsedTransactionWithMeta,
): SolanaTx => ({
  id: parsedTx.transaction.signatures[0],
  ecosystemId: SOLANA_ECOSYSTEM_ID,
  timestamp: parsedTx.blockTime ?? null,
  interactionId: null,
  original: parsedTx,
});
