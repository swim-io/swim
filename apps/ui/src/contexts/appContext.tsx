import type React from "react";

import { EcosystemId } from "../config";

import { EvmConnectionProvider } from "./evmConnection";
import { QueryClientProvider } from "./queryClient";
import { SolanaConnectionProvider } from "./solanaConnection";

export const AppContext: React.FC = ({ children }) => (
  <QueryClientProvider>
    <SolanaConnectionProvider>
      <EvmConnectionProvider ecosystemId={EcosystemId.Ethereum}>
        <EvmConnectionProvider ecosystemId={EcosystemId.Bsc}>
          <EvmConnectionProvider ecosystemId={EcosystemId.Avalanche}>
            <EvmConnectionProvider ecosystemId={EcosystemId.Polygon}>
              <EvmConnectionProvider ecosystemId={EcosystemId.Aurora}>
                <EvmConnectionProvider ecosystemId={EcosystemId.Fantom}>
                  <EvmConnectionProvider ecosystemId={EcosystemId.Karura}>
                    <EvmConnectionProvider ecosystemId={EcosystemId.Acala}>
                      {children}
                    </EvmConnectionProvider>
                  </EvmConnectionProvider>
                </EvmConnectionProvider>
              </EvmConnectionProvider>
            </EvmConnectionProvider>
          </EvmConnectionProvider>
        </EvmConnectionProvider>
      </EvmConnectionProvider>
    </SolanaConnectionProvider>
  </QueryClientProvider>
);
