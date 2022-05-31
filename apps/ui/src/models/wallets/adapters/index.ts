import type { EvmWalletAdapter } from "./evm";
import {
  acalaAdapters,
  auroraAdapters,
  avalancheAdapters,
  bscAdapters,
  ethereumAdapters,
  fantomAdapters,
  karuraAdapters,
  polygonAdapters,
} from "./evm";
import type { SolanaWalletAdapter } from "./solana";
import { solanaAdapters } from "./solana";

export type { EvmWalletAdapter, SolanaWalletAdapter };

export type WalletAdapter = EvmWalletAdapter | SolanaWalletAdapter;

export const adapters = {
  acala: acalaAdapters,
  aurora: auroraAdapters,
  avalanche: avalancheAdapters,
  bsc: bscAdapters,
  ethereum: ethereumAdapters,
  fantom: fantomAdapters,
  karura: karuraAdapters,
  polygon: polygonAdapters,
  solana: solanaAdapters,
};
