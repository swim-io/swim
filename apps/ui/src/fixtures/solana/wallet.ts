import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

export const MOCK_SOL_WALLET = {
  publicKey: new PublicKey("6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"),
  address: "6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J",
  signTransaction: (transaction: Transaction) => Promise.resolve(transaction),
};
