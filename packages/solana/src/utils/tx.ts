import { Transaction, TransactionBlockhashCtor } from "@solana/web3.js";

export type CreateTxOptions = Omit<
  TransactionBlockhashCtor,
  "blockhash" | "lastValidBlockHeight"
>;

/** Create transaction with dummy blockhash and lastValidBlockHeight, expected to be overwritten by solanaConnection.sendAndConfirmTx to prevent expired blockhash */
export const createTx = (opts: CreateTxOptions): Transaction =>
  new Transaction({ ...opts, blockhash: "", lastValidBlockHeight: 0 });
