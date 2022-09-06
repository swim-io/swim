import { SolanaConnection } from "@swim-io/solana";
import type { ReactElement, ReactNode } from "react";
import { createContext, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config/ecosystem";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

export const SolanaConnectionContext: React.Context<null | SolanaConnection> =
  createContext<null | SolanaConnection>(null);

export const SolanaConnectionProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [{ endpoints }] = chains[Protocol.Solana];

  const connection = useMemo(
    () => new SolanaConnection(endpoints),
    [endpoints],
  );

  return (
    <SolanaConnectionContext.Provider value={connection}>
      {children}
    </SolanaConnectionContext.Provider>
  );
};
