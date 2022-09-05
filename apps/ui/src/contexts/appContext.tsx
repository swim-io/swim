import type React from "react";

import { EvmConnectionsProvider } from "./EvmConnections";
import { SolanaConnectionProvider } from "./SolanaConnection";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <EvmConnectionsProvider>
    <SolanaConnectionProvider>
      <QueryClientProvider>{children}</QueryClientProvider>
    </SolanaConnectionProvider>
  </EvmConnectionsProvider>
);
