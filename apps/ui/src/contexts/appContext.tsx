import type React from "react";

import { ActiveInteractionProvider } from "./activeInteraction";
import { QueryClientProvider } from "./queryClient";
import { SolanaConnectionProvider } from "./solanaConnection";

export const AppContext: React.FC = ({ children }) => (
  <QueryClientProvider>
    <SolanaConnectionProvider>
      <ActiveInteractionProvider>{children}</ActiveInteractionProvider>
    </SolanaConnectionProvider>
  </QueryClientProvider>
);
