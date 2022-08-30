import { SolanaWeb3WalletAdapter } from "./SolanaWalletAdapter";
import type { SolanaWeb3WalletService } from "./SolanaWalletAdapter";

const getMathWalletService = (): SolanaWeb3WalletService | null =>
  window.solana?.isMathWallet
    ? (window.solana as SolanaWeb3WalletService)
    : null;

export class MathWalletAdapter extends SolanaWeb3WalletAdapter {
  constructor() {
    super("MathWallet", "https://mathwallet.org", getMathWalletService);
  }
}
