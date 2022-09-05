import type { EvmEcosystemId } from "@swim-io/evm";
import { createContext, useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type React from "react";

import { useEnvironment } from "../core/store";
import type { EvmConnection } from "../models";

export const EvmConnectionsContext: React.Context<
  ReadonlyMap<EvmEcosystemId, EvmConnection>
> = createContext<ReadonlyMap<EvmEcosystemId, EvmConnection>>(new Map());

export const EvmConnectionsProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { env } = useEnvironment();
  const [connections, setConnections] = useState(new Map());

  useEffect(() => {
    setConnections(new Map());
  }, [env]);

  return (
    <EvmConnectionsContext.Provider value={connections}>
      {children}
    </EvmConnectionsContext.Provider>
  );
};
