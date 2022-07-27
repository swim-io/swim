import { ethers } from "ethers";

import { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

const getMathWalletService = (): ethers.providers.Web3Provider | null =>
  window.ethereum?.isMathWallet
    ? new ethers.providers.Web3Provider(window.ethereum, "any")
    : null;

export class MathWalletAdapter extends EvmWeb3WalletAdapter {
  constructor() {
    super("MathWallet", "https://mathwallet.org", getMathWalletService);
  }
}
