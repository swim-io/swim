import type { AptosWalletAdapter } from "@swim-io/aptos";
import { aptosAdapters } from "@swim-io/aptos";
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

export type WalletAdapter =
  | EvmWalletAdapter
  | SolanaWalletAdapter
  | AptosWalletAdapter;

export const adapters = {
  acala: acalaAdapters,
  aptos: aptosAdapters,
  aurora: auroraAdapters,
  avalanche: avalancheAdapters,
  bnb: bnbAdapters,
  ethereum: ethereumAdapters,
  fantom: fantomAdapters,
  karura: karuraAdapters,
  polygon: polygonAdapters,
  solana: solanaAdapters,
};
