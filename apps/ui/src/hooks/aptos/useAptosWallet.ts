import { selectAptosAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { AptosWalletInterface } from "../../models";

export const useAptosWallet = (): AptosWalletInterface => {
  const wallet = useWalletAdapter(selectAptosAdapter);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
