import { Env } from "@swim-io/core";
import type { EvmChainConfig, GetHistoryProvider } from "@swim-io/evm";
import {
  EtherscanFamilyProvider,
  EvmClient,
  EvmEcosystemId,
  MoralisProvider,
  PolkadotProvider,
  SimpleGetHistoryProvider,
  getEtherscanFamilyNetwork,
} from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import { createContext, useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import type React from "react";
import shallow from "zustand/shallow.js";

import { Protocol, isEcosystemEnabled } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

const MORALIS_ID = process.env.REACT_APP_MORALIS_ID;

export const GetEvmClientContext: React.Context<
  (ecosystemId: EvmEcosystemId) => EvmClient
> = createContext((_: EvmEcosystemId): EvmClient => {
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
  [Env.Testnet]: process.env.REACT_APP_BNB_TESTNET_RPC_URL,
};

const KARURA_RPC_URLS = {
  [Env.Mainnet]: process.env.REACT_APP_KARURA_MAINNET_RPC_URL,
  [Env.Testnet]: process.env.REACT_APP_KARURA_TESTNET_RPC_URL,
};

const KARURA_SUBQL_URLS = {
  [Env.Mainnet]: process.env.REACT_APP_KARURA_MAINNET_SUBQL_URL,
  [Env.Testnet]: process.env.REACT_APP_KARURA_TESTNET_SUBQL_URL,
};

export const getProvider = (
  env: Env,
  chainConfig: EvmChainConfig,
  ecosystemId: EvmEcosystemId,
): GetHistoryProvider => {
  const { publicRpcUrls } = chainConfig;
  if (
    (env !== Env.Mainnet && env !== Env.Testnet) ||
    !isEcosystemEnabled(ecosystemId)
  ) {
    return new SimpleGetHistoryProvider(publicRpcUrls[0]);
  }
  switch (ecosystemId) {
    case EvmEcosystemId.Acala:
      return new SimpleGetHistoryProvider(publicRpcUrls[0]);
    case EvmEcosystemId.Karura: {
      const rpcUrl = KARURA_RPC_URLS[env];
      const subqlUrl = KARURA_SUBQL_URLS[env];
      if (env === Env.Mainnet && (!rpcUrl || !subqlUrl)) {
        throw new Error("Missing Karura RPC or SUBQL URL");
      }
      return rpcUrl && subqlUrl
        ? new PolkadotProvider(rpcUrl, subqlUrl)
        : new SimpleGetHistoryProvider(publicRpcUrls[0]);
    }
    case EvmEcosystemId.Bnb: {
      try {
        const rpcUrl = BNB_RPC_URLS[env];
        if (!rpcUrl) {
          throw new Error("Missing BNB RPC URL");
        }
        if (!MORALIS_ID) {
          throw new Error("Missing MORALIS_ID env variable");
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
          return new SimpleGetHistoryProvider(publicRpcUrls[0]);
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
        return new SimpleGetHistoryProvider(publicRpcUrls[0]);
      }
      return new EtherscanFamilyProvider(
        network,
        ETHERSCAN_FAMILY_API_KEYS.get(ecosystemId),
      );
    }
  }
};

export const GetEvmClientProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const evmConnections = useRef<ReadonlyMap<EvmEcosystemId, EvmClient>>(
    new Map(),
  );

  const getEvmClient = (ecosystemId: EvmEcosystemId) => {
    const existingEvmClient = evmConnections.current.get(ecosystemId);
    if (existingEvmClient) {
      return existingEvmClient;
    }

    const chainConfig = findOrThrow(
      chains[Protocol.Evm],
      (chain) => chain.ecosystem === ecosystemId,
    );
    const provider = getProvider(env, chainConfig, ecosystemId);
    const newEvmClient = new EvmClient(ecosystemId, chainConfig, { provider });

    const newState = new Map(evmConnections.current);
    newState.set(ecosystemId, newEvmClient);
    // eslint-disable-next-line functional/immutable-data
    evmConnections.current = newState;
    return newEvmClient;
  };

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    evmConnections.current = new Map();
  }, [env]);

  return (
    <GetEvmClientContext.Provider value={getEvmClient}>
      {children}
    </GetEvmClientContext.Provider>
  );
};
