import { useEffect } from "react";

import { selectEvmAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { EvmWalletAdapter } from "../../models";
import { useRerender } from "../utils";

export interface EvmWalletInterface {
  readonly wallet: EvmWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export const useEvmWallet = (): EvmWalletInterface => {
  const wallet = useWalletAdapter(selectEvmAdapter);
  const rerender = useRerender();

  useEffect(() => {
    if (!wallet) return;

    wallet.on("connect", rerender);
    wallet.on("disconnect", rerender);

    return () => {
      wallet.off("connect", rerender);
      wallet.off("disconnect", rerender);
    };
  }, [wallet, rerender]);

  return {
    wallet,
    address: wallet ? wallet.address : null,
    connected: wallet ? wallet.connected : false,
  };
};
