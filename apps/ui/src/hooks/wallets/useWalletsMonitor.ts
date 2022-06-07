import { useEffect } from "react";

import { useNotification, useWalletAdapter } from "../../core/store";
import { isNotNull, shortenAddress } from "../../utils";

type WalletAdapterListeners = {
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly error: (title: string, description: string) => void;
};

export const useWalletsMonitor = (): void => {
  const { notify } = useNotification();
  const { evm, solana } = useWalletAdapter();

  useEffect(() => {
    const walletAdapters = [evm, solana].filter(isNotNull);

    if (!walletAdapters.length) return;

    const listeners: readonly WalletAdapterListeners[] = walletAdapters.map(
      (walletAdapter) => {
        const handleConnect = (): void => {
          if (walletAdapter.address) {
            notify(
              "Wallet update",
              `Connected to wallet ${shortenAddress(walletAdapter.address)}`,
              "info",
              7000,
            );
          }
        };
        const handleDisconnect = (): void => {
          notify("Wallet update", "Disconnected from wallet", "warning");
        };
        const handleError = (title: string, description: string): void => {
          notify(title, description, "error");
        };

        walletAdapter.on("connect", handleConnect);
        walletAdapter.on("disconnect", handleDisconnect);
        walletAdapter.on("error", handleError);

        return {
          connect: handleConnect,
          disconnect: handleDisconnect,
          error: handleError,
        };
      },
    );

    return () => {
      walletAdapters.forEach((walletAdapter, index) => {
        const { connect, disconnect, error } = listeners[index];
        walletAdapter.off("connect", connect);
        walletAdapter.off("disconnect", disconnect);
        walletAdapter.off("error", error);
      });
    };
  }, [evm, solana, notify]);
};
