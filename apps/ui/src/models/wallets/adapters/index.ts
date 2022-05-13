import type { EvmWalletAdapter } from "./evm";
import {
  avalancheAdapters,
  bscAdapters,
  ethereumAdapters,
  polygonAdapters,
} from "./evm";
import type { SolanaWalletAdapter } from "./solana";
import { solanaAdapters } from "./solana";

export type { EvmWalletAdapter, SolanaWalletAdapter };

export type WalletAdapter = EvmWalletAdapter | SolanaWalletAdapter;

export const adapters = {
  avalanche: avalancheAdapters,
  bsc: bscAdapters,
  ethereum: ethereumAdapters,
  polygon: polygonAdapters,
  solana: solanaAdapters,
};
