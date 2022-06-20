import { selectSolanaAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { SolanaWalletAdapter } from "../../models";

export interface SolanaWalletInterface {
  readonly wallet: SolanaWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export const useSolanaWallet = (): SolanaWalletInterface => {
  const wallet = useWalletAdapter(selectSolanaAdapter);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
