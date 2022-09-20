import type { WalletAdapter } from "./BaseAdapter";
import { MartianWalletAdapter } from "./MartianWalletAdapter";

export type { IMartianWallet } from "./MartianWalletAdapter";

export type AptosWalletAdapter = WalletAdapter;

export const aptosAdapters = {
  MartianWalletAdapter,
};
