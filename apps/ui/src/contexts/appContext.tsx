import type React from "react";

import { ActiveInteractionProvider } from "./activeInteraction";
import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <QueryClientProvider>
    <ActiveInteractionProvider>{children}</ActiveInteractionProvider>
  </QueryClientProvider>
);
