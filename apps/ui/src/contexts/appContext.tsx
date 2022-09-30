import type React from "react";

import { AptosClientProvider } from "./AptosClient";
import { GetEvmClientProvider } from "./GetEvmClient";
import { SolanaClientProvider } from "./SolanaClient";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <AptosClientProvider>
    <GetEvmClientProvider>
      <SolanaClientProvider>
        <QueryClientProvider>{children}</QueryClientProvider>
      </SolanaClientProvider>
    </GetEvmClientProvider>
  </AptosClientProvider>
);
