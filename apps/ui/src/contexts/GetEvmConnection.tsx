import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import { createContext, useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type React from "react";
import shallow from "zustand/shallow.js";

import type { EvmSpec } from "../config";
import { Protocol, isEcosystemEnabled } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";
import type { Provider } from "../models";
import {
  EtherscanFamilyProvider,
  EvmConnection,
  LocalProvider,
  MoralisProvider,
  PolkadotProvider,
  getEtherscanFamilyNetwork,
} from "../models";

const MORALIS_ID = "Swim UI";

export const GetEvmConnectionContext: React.Context<
  (ecosystemId: EvmEcosystemId) => EvmConnection
> = createContext((_: EvmEcosystemId): EvmConnection => {
  throw new Error("Not initialized");
});

const ETHERSCAN_FAMILY_API_KEYS = new Map([
  [EvmEcosystemId.Aurora, process.env.REACT_APP_AURORASCAN_API_KEY],
  [EvmEcosystemId.Avalanche, process.env.REACT_APP_SNOWTRACE_API_KEY],
  [EvmEcosystemId.Ethereum, process.env.REACT_APP_ETHERSCAN_API_KEY],
  [EvmEcosystemId.Fantom, process.env.REACT_APP_FTMSCAN_API_KEY],
  [EvmEcosystemId.Polygon, process.env.REACT_APP_POLYGONSCAN_API_KEY],
]);

const BNB_RPC_URLS = {
  [Env.Mainnet]: process.env.REACT_APP_BNB_MAINNET_RPC_URL,
  [Env.Devnet]: process.env.REACT_APP_BNB_TESTNET_RPC_URL,
};

const KARURA_RPC_URLS = {
  [Env.Mainnet]: process.env.REACT_APP_KARURA_MAINNET_RPC_URL,
  [Env.Devnet]: process.env.REACT_APP_KARURA_TESTNET_RPC_URL,
};

const KARURA_SUBQL_URLS = {
  [Env.Mainnet]: process.env.REACT_APP_KARURA_MAINNET_SUBQL_URL,
  [Env.Devnet]: process.env.REACT_APP_KARURA_TESTNET_SUBQL_URL,
};

export const getProvider = (
  env: Env,
  chains: readonly EvmSpec[],
  ecosystemId: EvmEcosystemId,
): Provider => {
  const { rpcUrls } = findOrThrow(
    chains,
    (chain) => chain.ecosystem === ecosystemId,
  );
  if (
    (env !== Env.Mainnet && env !== Env.Devnet) ||
    !isEcosystemEnabled(ecosystemId)
  ) {
    return new LocalProvider(rpcUrls[0]);
  }
  switch (ecosystemId) {
    case EvmEcosystemId.Acala:
      return new LocalProvider(rpcUrls[0]);
    case EvmEcosystemId.Karura: {
      const rpcUrl = KARURA_RPC_URLS[env];
      const subqlUrl = KARURA_SUBQL_URLS[env];
      if (env === Env.Mainnet && (!rpcUrl || !subqlUrl)) {
        throw new Error("Missing Karura RPC or SUBQL URL");
      }
      return rpcUrl && subqlUrl
        ? new PolkadotProvider(rpcUrl, subqlUrl)
        : new LocalProvider(rpcUrls[0]);
    }
    case EvmEcosystemId.Bnb: {
      try {
        const rpcUrl = BNB_RPC_URLS[env];
        if (!rpcUrl) {
          throw new Error("Missing BNB RPC URL");
        }
        return new MoralisProvider(env, rpcUrl, MORALIS_ID);
      } catch (error) {
        // Fall back to basic Bscscan provider with no API key
        // This is useful eg for coding challenges
        if (process.env.NODE_ENV !== "development") {
          throw error;
        }
        const network = getEtherscanFamilyNetwork(env, ecosystemId);
        if (network === null) {
          return new LocalProvider(rpcUrls[0]);
        }
        return new EtherscanFamilyProvider(network);
      }
    }
    case EvmEcosystemId.Aurora:
    case EvmEcosystemId.Avalanche:
    case EvmEcosystemId.Ethereum:
    case EvmEcosystemId.Fantom:
    case EvmEcosystemId.Polygon: {
      const network = getEtherscanFamilyNetwork(env, ecosystemId);
      if (network === null) {
        return new LocalProvider(rpcUrls[0]);
      }
      return new EtherscanFamilyProvider(
        network,
        ETHERSCAN_FAMILY_API_KEYS.get(ecosystemId),
      );
    }
  }
};

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

    const provider = getProvider(env, chains[Protocol.Evm], ecosystemId);
    const newEvmConnection = new EvmConnection(provider);
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
