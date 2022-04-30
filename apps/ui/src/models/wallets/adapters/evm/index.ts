import { MathWalletAdapter } from "./MathWalletAdapter";
import { MetaMaskAdapter } from "./MetaMaskAdapter";

export type { EvmWalletAdapter } from "./EvmWalletAdapter";
export { EvmWeb3WalletAdapter } from "./EvmWalletAdapter";

export const ethereumAdapters = {
  MathWalletAdapter,
  MetaMaskAdapter,
};

export const bscAdapters = {
  MathWalletAdapter,
  MetaMaskAdapter,
};
