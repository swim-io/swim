import { AptosClient } from "@swim-io/aptos";
import type { ReactElement, ReactNode } from "react";
import { createContext, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config/ecosystem";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

export const AptosClientContext: React.Context<null | AptosClient> =
  createContext<AptosClient | null>(null);

export const AptosClientProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chain] = chains[Protocol.Aptos];

  const client = useMemo(
    () => new AptosClient(chain.publicRpcUrls[0]),
    [chain],
  );

  return (
    <AptosClientContext.Provider value={client}>
      {children}
    </AptosClientContext.Provider>
  );
};
