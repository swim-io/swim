import { useEffect } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import { captureException } from "../../errors";
import { WalletServiceId, createAdapter } from "../../models";
import { waitFor } from "../../utils";

export const useWalletAutoConnect = (): null => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoint }] = chains[Protocol.Solana];
  const { connectService, selectedServiceByProtocol } = useWalletAdapter();

  useEffect(() => {
    void (async () => {
      [Protocol.Evm, Protocol.Solana].forEach(async (protocol) => {
        const serviceId = selectedServiceByProtocol[protocol];

        if (serviceId) {
          try {
            const adapter = createAdapter(serviceId, protocol, endpoint);
            const options = { silentError: true };
            const timeoutForWalletToBeFound = 2000;

            if (adapter.protocol === Protocol.Evm) {
              const [isUnlocked, hasConnectedBefore] = await Promise.all([
                adapter.isUnlocked(),
                adapter.hasConnectedBefore(),
              ]);

              if (isUnlocked && hasConnectedBefore) {
                await connectService({ protocol, serviceId, adapter, options });
              }
            } else if (serviceId === WalletServiceId.Phantom) {
              const foundPhantom = await waitFor(
                () => (window as any).phantom !== undefined,
                timeoutForWalletToBeFound,
              );

              if (foundPhantom)
                await connectService({
                  protocol,
                  serviceId,
                  adapter,
                  options: {
                    ...options,
                    connectArgs: { onlyIfTrusted: true },
                  },
                });
            } else if (serviceId === WalletServiceId.Solong) {
              const foundSolong = await waitFor(
                () => (window as any).solong !== undefined,
                timeoutForWalletToBeFound,
              );

              if (foundSolong) {
                const address = await (window as any).solong?.selectAccount();

                if (address)
                  await connectService({
                    protocol,
                    serviceId,
                    adapter,
                    options,
                  });
              }
            }
          } catch (error) {
            captureException(error);
          }
        }
      });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- we want this to run only once on app boot

  return null;
};
