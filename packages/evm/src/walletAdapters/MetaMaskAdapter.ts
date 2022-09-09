import { ethers } from "ethers";

import { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

const getMetaMaskService = (): ethers.providers.Web3Provider | null =>
  window.ethereum?.isMetaMask
    ? new ethers.providers.Web3Provider(window.ethereum, "any")
    : null;

const isUnlocked = async (): Promise<boolean> => {
  try {
    return window.ethereum?.isMetaMask
      ? (await window.ethereum._metamask?.isUnlocked?.()) ?? false
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

  public override async connect(): Promise<void> {
    await super.connect();

    // Experimental method
    try {
      if (!(await window.ethereum?._metamask?.isUnlocked?.())) {
        this.emit("error", "Metamask error", "Please unlock your wallet");
      }
    } catch {
      // Hopefully this feature gets moved out of "experimental" status
    }
  }
}
