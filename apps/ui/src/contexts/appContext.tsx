import type React from "react";

import { QueryClientProvider } from "./queryClient";

export const AppContext: React.FC = ({ children }) => (
  <QueryClientProvider>{children}</QueryClientProvider>
);
