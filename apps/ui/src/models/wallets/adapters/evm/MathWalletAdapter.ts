import { ethers } from "ethers";

import { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

const getMathWalletService = (): ethers.providers.Web3Provider | null =>
  (window as any).ethereum?.isMathWallet
    ? new ethers.providers.Web3Provider((window as any).ethereum, "any")
    : null;

export class MathWalletAdapter extends EvmWeb3WalletAdapter {
  constructor() {
    super("MathWallet", "https://mathwallet.org", getMathWalletService);
  }
}
