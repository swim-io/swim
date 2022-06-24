import { ethers } from "ethers";

import { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

const getMetaMaskService = (): ethers.providers.Web3Provider | null =>
  (window as any).ethereum?.isMetaMask
    ? new ethers.providers.Web3Provider((window as any).ethereum, "any")
    : null;

const isUnlocked = async (): Promise<boolean> => {
  try {
    // all the methods in `_metamask` are considered experimental/unstable
    return (window as any).ethereum?.isMetaMask
      ? await (window as any).ethereum?._metamask?.isUnlocked()
      : false;
  } catch (error) {
    console.warn("Failed to check if MetaMask is unlocked", error);
    return false;
  }
};

export class MetaMaskAdapter extends EvmWeb3WalletAdapter {
  constructor() {
    super("MetaMask", "https://metamask.io", getMetaMaskService, isUnlocked);
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
