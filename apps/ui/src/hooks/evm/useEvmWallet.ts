import { selectEvmAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { EvmWalletAdapter } from "../../models";

export interface EvmWalletInterface {
  readonly wallet: EvmWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export const useEvmWallet = (): EvmWalletInterface => {
  const wallet = useWalletAdapter(selectEvmAdapter);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
