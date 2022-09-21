import type React from "react";

import { AptosClientProvider } from "./AptosClient";
import { GetEvmConnectionProvider } from "./GetEvmConnection";
import { SolanaConnectionProvider } from "./SolanaConnection";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <AptosClientProvider>
    <GetEvmConnectionProvider>
      <SolanaConnectionProvider>
        <QueryClientProvider>{children}</QueryClientProvider>
      </SolanaConnectionProvider>
    </GetEvmConnectionProvider>
  </AptosClientProvider>
);
