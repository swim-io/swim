import { useEffect } from "react";

import { Protocol } from "../../config";
import { useWalletAdapter } from "../../core/store";
import { captureException } from "../../errors";
import { WalletServiceId, createAdapter } from "../../models";

import { useWalletService } from "./useWalletService";

export const useWalletAutoConnect = () => {
  const { connectService, selectedServiceByProtocol } = useWalletAdapter();
  const { solanaEndpoint } = useWalletService();

  useEffect(() => {
    void (async () => {
      [Protocol.Evm, Protocol.Solana].forEach(async (protocol) => {
        const walletServiceId = selectedServiceByProtocol[protocol];

        if (walletServiceId) {
          try {
            const adapter = createAdapter(
              walletServiceId,
              protocol,
              solanaEndpoint,
            );

            if (adapter.protocol === Protocol.Evm) {
              const [isUnlocked, hasConnectedBefore] = await Promise.all([
                adapter.isUnlocked(),
                adapter.hasConnectedBefore(),
              ]);

              if (isUnlocked && hasConnectedBefore) {
                await connectService(protocol, walletServiceId, adapter);
              }
            } else if (walletServiceId === WalletServiceId.Phantom) {
              await connectService(protocol, walletServiceId, adapter, {
                onlyIfTrusted: true,
              });
            }
          } catch (error) {
            captureException(error);
          }
        }
      });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- we want this to run only once on app boot
};
