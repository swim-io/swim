import type { ReactElement, ReactNode } from "react";
import { useContext, useMemo } from "react";
import * as React from "react";

import type { EvmEcosystemId } from "../config";
import { EcosystemId, Env, Protocol, chains } from "../config";
import { EvmConnection } from "../models";
import type { ReadonlyRecord } from "../utils";
import { findOrThrow } from "../utils";

import { useConfig, useEnvironment } from "./environment";

const EthereumConnectionContext = React.createContext<EvmConnection>(
  new EvmConnection(Env.Mainnet, chains[Env.Mainnet][Protocol.Evm][0]),
);

const BscConnectionContext = React.createContext<EvmConnection>(
  new EvmConnection(Env.Mainnet, chains[Env.Mainnet][Protocol.Evm][1]),
);

const AvalancheConnectionContext = React.createContext<EvmConnection>(
  new EvmConnection(Env.Mainnet, chains[Env.Mainnet][Protocol.Evm][2]),
);

const PolygonConnectionContext = React.createContext<EvmConnection>(
  new EvmConnection(Env.Mainnet, chains[Env.Mainnet][Protocol.Evm][3]),
);

const ecosystemToContext: ReadonlyRecord<
  EvmEcosystemId,
  React.Context<EvmConnection>
> = {
  [EcosystemId.Ethereum]: EthereumConnectionContext,
  [EcosystemId.Bsc]: BscConnectionContext,
  [EcosystemId.Avalanche]: AvalancheConnectionContext,
  [EcosystemId.Polygon]: PolygonConnectionContext,
};

interface EvmConnectionProviderProps {
  readonly ecosystemId: EvmEcosystemId;
  readonly children?: ReactNode;
}

export const EvmConnectionProvider = ({
  ecosystemId,
  children,
}: EvmConnectionProviderProps): ReactElement => {
  const { env } = useEnvironment();
  const { chains: evmChains } = useConfig();
  const chainSpec = findOrThrow(
    evmChains[Protocol.Evm],
    (chain) => chain.ecosystem === ecosystemId,
  );
  const connection = useMemo(
    () => new EvmConnection(env, chainSpec),
    [env, chainSpec],
  );
  const EvmConnectionContext = ecosystemToContext[ecosystemId];
  return (
    <EvmConnectionContext.Provider value={connection}>
      {children}
    </EvmConnectionContext.Provider>
  );
};

export const useEvmConnections = (): ReadonlyRecord<
  EvmEcosystemId,
  EvmConnection
> => ({
  [EcosystemId.Ethereum]: useContext(EthereumConnectionContext),
  [EcosystemId.Bsc]: useContext(BscConnectionContext),
  [EcosystemId.Avalanche]: useContext(AvalancheConnectionContext),
  [EcosystemId.Polygon]: useContext(PolygonConnectionContext),
});

export const useEvmConnection = (
  ecosystemId: EvmEcosystemId,
): EvmConnection => {
  const evmConnections = useEvmConnections();
  return evmConnections[ecosystemId];
};
