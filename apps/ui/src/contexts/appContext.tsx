import type React from "react";

import { AptosClientProvider } from "./AptosClient";
import { GetEvmConnectionProvider } from "./GetEvmConnection";
import { SolanaClientProvider } from "./SolanaClient";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <AptosClientProvider>
    <GetEvmConnectionProvider>
      <SolanaClientProvider>
        <QueryClientProvider>{children}</QueryClientProvider>
      </SolanaClientProvider>
    </GetEvmConnectionProvider>
  </AptosClientProvider>
);
