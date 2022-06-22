import { useEffect } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import { captureException } from "../../errors";
import { WalletServiceId, createAdapter } from "../../models";

export const useWalletAutoConnect = () => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoint }] = chains[Protocol.Solana];
  const { connectService, selectedServiceByProtocol } = useWalletAdapter();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      [Protocol.Evm, Protocol.Solana].forEach(async (protocol) => {
        const serviceId = selectedServiceByProtocol[protocol];

        if (serviceId) {
          try {
            const adapter = createAdapter(serviceId, protocol, endpoint);
            const options = { silentError: true };

            if (adapter.protocol === Protocol.Evm) {
              const [isUnlocked, hasConnectedBefore] = await Promise.all([
                adapter.isUnlocked(),
                adapter.hasConnectedBefore(),
              ]);

              if (isUnlocked && hasConnectedBefore) {
                await connectService({ protocol, serviceId, adapter, options });
              }
            } else if (serviceId === WalletServiceId.Phantom) {
              timeout = setTimeout(async () => {
                await connectService({
                  protocol,
                  serviceId,
                  adapter,
                  options: {
                    ...options,
                    connectArgs: { onlyIfTrusted: true },
                  },
                });
              }, 500);
            } else if (serviceId === WalletServiceId.Solong) {
              timeout = setTimeout(async () => {
                const address = await (window as any).solong?.selectAccount();
                if (address)
                  await connectService({
                    protocol,
                    serviceId,
                    adapter,
                    options,
                  });
              }, 500);
            }
          } catch (error) {
            captureException(error);
          }
        }
      });
    })();

    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- we want this to run only once on app boot
};
