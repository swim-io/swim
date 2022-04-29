import { ethers } from "ethers";

import { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

const getMetaMaskService = (): ethers.providers.Web3Provider | null =>
  (window as any).ethereum?.isMetaMask
    ? new ethers.providers.Web3Provider((window as any).ethereum, "any")
    : null;

export class MetaMaskAdapter extends EvmWeb3WalletAdapter {
  constructor(chainId: number) {
    super(chainId, "MetaMask", "https://metamask.io", getMetaMaskService);
  }

  async connect(): Promise<void> {
    await super.connect();

    // Experimental method
    try {
      if (!(await (window as any).ethereum?._metamask?.isUnlocked())) {
        this.emit("error", "Metamask error", "Please unlock your wallet");
      }
    } catch {
      // Hopefully this feature gets moved out of "experimental" status
    }
  }
}
