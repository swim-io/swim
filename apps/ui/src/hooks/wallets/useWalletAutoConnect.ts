import { isNotNull, waitFor } from "@swim-io/utils";
import { useEffect } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { getSolanaEndpoints } from "../../contexts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useWalletAdapter } from "../../core/store";
import { captureException } from "../../errors";
import { WalletServiceId, createAdapter } from "../../models";

export const useWalletAutoConnect = (): null => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [solanaEndpoint] =
    getSolanaEndpoints(env) ?? chains[Protocol.Solana][0].publicRpcUrls;
  const { connectService, selectedServiceByProtocol } = useWalletAdapter();

  useEffect(() => {
    const isAptosEnabled = !!process.env.REACT_APP_ENABLE_APTOS;

    Promise.all(
      [Protocol.Evm, Protocol.Solana, isAptosEnabled ? Protocol.Aptos : null]
        .filter(isNotNull)
        .map(async (protocol) => {
          const serviceId = selectedServiceByProtocol[protocol];

          if (serviceId) {
            try {
              const adapter = createAdapter(
                serviceId,
                protocol,
                solanaEndpoint,
              );
              const options = { silentError: true };
              const timeoutForWalletToBeFound = 2000;

              if (adapter.protocol === Protocol.Evm) {
                const [isUnlocked, hasConnectedBefore] = await Promise.all([
                  adapter.isUnlocked(),
                  adapter.hasConnectedBefore(),
                ]);

                if (isUnlocked && hasConnectedBefore) {
                  await connectService({
                    protocol,
                    serviceId,
                    adapter,
                    options,
                  });
                }
              } else if (serviceId === WalletServiceId.Phantom) {
                const foundPhantom = await waitFor(
                  () => window.phantom !== undefined,
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
                  () => window.solong !== undefined,
                  timeoutForWalletToBeFound,
                );

                if (foundSolong) {
                  const address = await window.solong?.selectAccount();

                  if (address)
                    await connectService({
                      protocol,
                      serviceId,
                      adapter,
                      options,
                    });
                }
              } else if (serviceId === WalletServiceId.Martian) {
                const foundMartian = await waitFor(
                  () => window.martian !== undefined,
                  timeoutForWalletToBeFound,
                );

                if (foundMartian) {
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
        }),
    ).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- we want this to run only once on app boot

  return null;
};
