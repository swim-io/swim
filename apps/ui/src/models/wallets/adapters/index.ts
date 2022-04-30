import type { EvmWalletAdapter } from "./evm";
import { bscAdapters, ethereumAdapters } from "./evm";
import type { SolanaWalletAdapter } from "./solana";
import { solanaAdapters } from "./solana";

export type { EvmWalletAdapter, SolanaWalletAdapter };

export type WalletAdapter = EvmWalletAdapter | SolanaWalletAdapter;

export const adapters = {
  bsc: bscAdapters,
  ethereum: ethereumAdapters,
  solana: solanaAdapters,
};
