import type React from "react";

import { SolanaConnectionProvider } from "./SolanaConnection";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <SolanaConnectionProvider>
    <QueryClientProvider>{children}</QueryClientProvider>
  </SolanaConnectionProvider>
);
