import { selectEvmAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { EvmWalletInterface } from "../../models";

export const useEvmWallet = (): EvmWalletInterface => {
  const wallet = useWalletAdapter(selectEvmAdapter);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
