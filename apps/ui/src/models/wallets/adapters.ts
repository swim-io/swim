import type { EvmWalletAdapter } from "@swim-io/evm";
import {
  acalaAdapters,
  auroraAdapters,
  avalancheAdapters,
  bnbAdapters,
  ethereumAdapters,
  fantomAdapters,
  karuraAdapters,
  polygonAdapters,
} from "@swim-io/evm";
import type { SolanaWalletAdapter } from "@swim-io/solana";
import { solanaAdapters } from "@swim-io/solana";

export type WalletAdapter = EvmWalletAdapter | SolanaWalletAdapter;

export const adapters = {
  acala: acalaAdapters,
  aurora: auroraAdapters,
  avalanche: avalancheAdapters,
  bnb: bnbAdapters,
  ethereum: ethereumAdapters,
  fantom: fantomAdapters,
  karura: karuraAdapters,
  polygon: polygonAdapters,
  solana: solanaAdapters,
};
