import { SolanaWeb3WalletAdapter } from "./SolanaWalletAdapter";

const getMathWalletService = (): any =>
  (window as any).solana?.isMathWallet ? (window as any).solana : null;

export class MathWalletAdapter extends SolanaWeb3WalletAdapter {
  constructor() {
    super("MathWallet", "https://mathwallet.org", getMathWalletService);
  }
}
