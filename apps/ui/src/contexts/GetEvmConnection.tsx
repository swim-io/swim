import type { EvmEcosystemId } from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import { createContext, useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type React from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import { EvmConnection } from "../models";

export const GetEvmConnectionContext: React.Context<
  (ecosystemId: EvmEcosystemId) => EvmConnection
> = createContext((_: EvmEcosystemId): EvmConnection => {
  throw new Error("Not initialized");
});

export const GetEvmConnectionProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [evmConnections, setEvmConnections] = useState<
    ReadonlyMap<EvmEcosystemId, EvmConnection>
  >(new Map());

  const getEvmConnection = (ecosystemId: EvmEcosystemId) => {
    const existingEvmConnection = evmConnections.get(ecosystemId);
    if (existingEvmConnection) {
      return existingEvmConnection;
    }

    const chainSpec = findOrThrow(
      chains[Protocol.Evm],
      (chain) => chain.ecosystem === ecosystemId,
    );
    const newEvmConnection = new EvmConnection(env, chainSpec);
    setEvmConnections((prev) => {
      const newState = new Map(prev);
      newState.set(ecosystemId, newEvmConnection);
      return newState;
    });
    return newEvmConnection;
  };

  useEffect(() => {
    setEvmConnections(new Map());
  }, [env]);

  return (
    <GetEvmConnectionContext.Provider value={getEvmConnection}>
      {children}
    </GetEvmConnectionContext.Provider>
  );
};
