import { selectSolanaAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { SolanaWalletInterface } from "../../models";

export const useSolanaWallet = (): SolanaWalletInterface => {
  const wallet = useWalletAdapter(selectSolanaAdapter);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
