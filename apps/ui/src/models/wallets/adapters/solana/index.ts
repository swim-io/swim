import { MathWalletAdapter } from "./MathWalletAdapter";
import { PhantomAdapter } from "./PhantomAdapter";
import { SolanaDefaultWalletAdapter } from "./SolanaDefaultWalletAdapter";
import { SolongAdapter } from "./SolongAdapter";
import { LedgerWalletAdapter } from "./ledger";

export type { SolanaWalletAdapter } from "./SolanaWalletAdapter";

export const solanaAdapters = {
  LedgerWalletAdapter,
  MathWalletAdapter,
  PhantomAdapter,
  SolongAdapter,
  SolanaDefaultWalletAdapter,
};
