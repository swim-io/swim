import type React from "react";

import { EcosystemId } from "../config";

import { ActiveInteractionProvider } from "./activeInteraction";
import { EnvironmentProvider } from "./environment";
import { EvmConnectionProvider } from "./evmConnection";
import { EvmWalletProvider } from "./evmWallet";
import { QueryClientProvider } from "./queryClient";
import { SolanaConnectionProvider } from "./solanaConnection";
import { SolanaWalletProvider } from "./solanaWallet";

export const AppContext: React.FC = ({ children }) => (
  <EnvironmentProvider>
    <QueryClientProvider>
      <SolanaConnectionProvider>
        <SolanaWalletProvider>
          <EvmConnectionProvider ecosystemId={EcosystemId.Ethereum}>
            <EvmConnectionProvider ecosystemId={EcosystemId.Bsc}>
              <EvmConnectionProvider ecosystemId={EcosystemId.Avalanche}>
                <EvmConnectionProvider ecosystemId={EcosystemId.Polygon}>
                  <EvmWalletProvider ecosystemId={EcosystemId.Ethereum}>
                    <EvmWalletProvider ecosystemId={EcosystemId.Bsc}>
                      <EvmWalletProvider ecosystemId={EcosystemId.Avalanche}>
                        <EvmWalletProvider ecosystemId={EcosystemId.Polygon}>
                          <ActiveInteractionProvider>
                            {children}
                          </ActiveInteractionProvider>
                        </EvmWalletProvider>
                      </EvmWalletProvider>
                    </EvmWalletProvider>
                  </EvmWalletProvider>
                </EvmConnectionProvider>
              </EvmConnectionProvider>
            </EvmConnectionProvider>
          </EvmConnectionProvider>
        </SolanaWalletProvider>
      </SolanaConnectionProvider>
    </QueryClientProvider>
  </EnvironmentProvider>
);
