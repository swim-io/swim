import type React from "react";

import { EcosystemId } from "../config";

import { ActiveInteractionProvider } from "./activeInteraction";
import { EvmConnectionProvider } from "./evmConnection";
import { EvmWalletProvider } from "./evmWallet";
import { QueryClientProvider } from "./queryClient";
import { SolanaConnectionProvider } from "./solanaConnection";
import { SolanaWalletProvider } from "./solanaWallet";

export const AppContext: React.FC = ({ children }) => (
  <QueryClientProvider>
    <SolanaConnectionProvider>
      <SolanaWalletProvider>
        <EvmConnectionProvider ecosystemId={EcosystemId.Ethereum}>
          <EvmConnectionProvider ecosystemId={EcosystemId.Bsc}>
            <EvmConnectionProvider ecosystemId={EcosystemId.Avalanche}>
              <EvmConnectionProvider ecosystemId={EcosystemId.Polygon}>
                <EvmConnectionProvider ecosystemId={EcosystemId.Aurora}>
                  <EvmConnectionProvider ecosystemId={EcosystemId.Fantom}>
                    <EvmConnectionProvider ecosystemId={EcosystemId.Karura}>
                      <EvmConnectionProvider ecosystemId={EcosystemId.Acala}>
                        <EvmWalletProvider ecosystemId={EcosystemId.Ethereum}>
                          <EvmWalletProvider ecosystemId={EcosystemId.Bsc}>
                            <EvmWalletProvider
                              ecosystemId={EcosystemId.Avalanche}
                            >
                              <EvmWalletProvider
                                ecosystemId={EcosystemId.Polygon}
                              >
                                <EvmWalletProvider
                                  ecosystemId={EcosystemId.Aurora}
                                >
                                  <EvmWalletProvider
                                    ecosystemId={EcosystemId.Fantom}
                                  >
                                    <EvmWalletProvider
                                      ecosystemId={EcosystemId.Karura}
                                    >
                                      <EvmWalletProvider
                                        ecosystemId={EcosystemId.Acala}
                                      >
                                        <ActiveInteractionProvider>
                                          {children}
                                        </ActiveInteractionProvider>
                                      </EvmWalletProvider>
                                    </EvmWalletProvider>
                                  </EvmWalletProvider>
                                </EvmWalletProvider>
                              </EvmWalletProvider>
                            </EvmWalletProvider>
                          </EvmWalletProvider>
                        </EvmWalletProvider>
                      </EvmConnectionProvider>
                    </EvmConnectionProvider>
                  </EvmConnectionProvider>
                </EvmConnectionProvider>
              </EvmConnectionProvider>
            </EvmConnectionProvider>
          </EvmConnectionProvider>
        </EvmConnectionProvider>
      </SolanaWalletProvider>
    </SolanaConnectionProvider>
  </QueryClientProvider>
);
