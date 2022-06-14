import { useEffect } from "react";

import { selectSolanaAdapter } from "../../core/selectors";
import { useWalletAdapter } from "../../core/store";
import type { SolanaWalletAdapter } from "../../models";
import { useRerender } from "../utils";

export interface SolanaWalletInterface {
  readonly wallet: SolanaWalletAdapter | null;
  readonly address: string | null;
  readonly connected: boolean;
}

export const useSolanaWallet = (): SolanaWalletInterface => {
  const wallet = useWalletAdapter(selectSolanaAdapter);
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
