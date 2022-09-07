import type React from "react";

import { GetEvmConnectionProvider } from "./GetEvmConnection";
import { SolanaConnectionProvider } from "./SolanaConnection";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <GetEvmConnectionProvider>
    <SolanaConnectionProvider>
      <QueryClientProvider>{children}</QueryClientProvider>
    </SolanaConnectionProvider>
  </GetEvmConnectionProvider>
);
