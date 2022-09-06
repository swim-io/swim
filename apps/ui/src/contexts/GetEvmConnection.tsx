import { BscscanProvider } from "@ethers-ancillary/bsc";
import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import { findOrThrow } from "@swim-io/utils";
import { ethers } from "ethers";
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
  AuroraScanProvider,
  EvmConnection,
  FtmScanProvider,
  LocalProvider,
  MoralisProvider,
  PolkadotProvider,
  PolygonScanProvider,
  SnowTraceProvider,
  getAuroraScanNetwork,
  getFtmScanNetwork,
  getKaruraProvider,
  getKaruraSubQl,
  getPolygonScanNetwork,
  getSnowTraceNetwork,
} from "../models";

export const GetEvmConnectionContext: React.Context<
  (ecosystemId: EvmEcosystemId) => EvmConnection
> = createContext((_: EvmEcosystemId): EvmConnection => {
  throw new Error("Not initialized");
});

// TODO: Use proper endpoints via env
const BNB_MAINNET_RPC_URL = process.env.REACT_APP_BNB_MAINNET_RPC_URL;
const BNB_TESTNET_RPC_URL = process.env.REACT_APP_BNB_TESTNET_RPC_URL;

const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.REACT_APP_POLYGONSCAN_API_KEY;
const FTMSCAN_API_KEY = process.env.REACT_APP_FTMSCAN_API_KEY;
const AURORASCAN_API_KEY = process.env.REACT_APP_AURORASCAN_API_KEY;
const SNOWTRACE_API_KEY = process.env.REACT_APP_SNOWTRACE_API_KEY;

const MORALIS_ID = "Swim UI";

/**
 * Network names from:
 * https://github.com/ethers-io/ethers.js/blob/7b134bd5c9f07f60b2e38b110268042e10f68174/packages/providers/src.ts/alchemy-provider.ts#L57-L93
 */
const getEtherscanNetwork = (env: Env): ethers.providers.Networkish => {
  switch (env) {
    case Env.Mainnet:
      return "homestead";
    case Env.Devnet:
      return "goerli";
    default:
      throw new Error(`Etherscan does not support ${env}`);
  }
};

/**
 * Network names from:
 * https://github.com/ethers-io/ancillary-bsc/blob/559783304776d82da943fba2be43bfe99e93afc3/src.ts/bscscan-provider.ts#L15-L23
 */
const getBscscanNetwork = (env: Env): ethers.providers.Networkish => {
  switch (env) {
    case Env.Mainnet:
      return "bsc-mainnet";
    case Env.Devnet:
      return "bsc-testnet";
    default:
      throw new Error(`Bscscan does not support ${env}`);
  }
};

const getBnbRpcUrl = (env: Env): string => {
  switch (env) {
    case Env.Mainnet:
      if (BNB_MAINNET_RPC_URL === undefined) {
        throw new Error("BNB_MAINNET_RPC_URL is not set");
      }
      return BNB_MAINNET_RPC_URL;
    case Env.Devnet:
      if (BNB_TESTNET_RPC_URL === undefined) {
        throw new Error("BNB_TESTNET_RPC_URL is not set");
      }
      return BNB_TESTNET_RPC_URL;
    default:
      throw new Error(`${env} not supported by Moralis Provider`);
  }
};

export const getPublicProvider = (
  env: Env,
  ecosystemId: EvmEcosystemId,
): Provider => {
  switch (ecosystemId) {
    case EvmEcosystemId.Ethereum:
      return new ethers.providers.EtherscanProvider(
        getEtherscanNetwork(env),
        ETHERSCAN_API_KEY,
      );
    case EvmEcosystemId.Bnb:
      try {
        return new MoralisProvider(env, getBnbRpcUrl(env), MORALIS_ID);
      } catch (error) {
        // Fall back to basic Bscscan provider with no API key
        // This is useful eg for coding challenges
        if (process.env.NODE_ENV !== "development") {
          throw error;
        }
        return new BscscanProvider(getBscscanNetwork(env));
      }
    case EvmEcosystemId.Avalanche: {
      return new SnowTraceProvider(getSnowTraceNetwork(env), SNOWTRACE_API_KEY);
    }
    case EvmEcosystemId.Polygon: {
      return new PolygonScanProvider(
        getPolygonScanNetwork(env),
        POLYGONSCAN_API_KEY,
      );
    }
    case EvmEcosystemId.Karura: {
      return new PolkadotProvider(getKaruraProvider(env), getKaruraSubQl(env));
    }
    // TODO: Refactor repetitive code for PolygonScanProvider, SnowTraceProvider, FtmScanProvider, AuroraScanProvider
    // Provider classes are the same.
    // Differences are in `{X}Network`, `{X}Provider#constructor`, and URLs in `{X}Provider#getBaseUrl`
    // In EvmConnection, code is almost the same in `get{X}Network` functions and in switch-case in `getPublicEvmIndexerProvider`
    case EvmEcosystemId.Fantom: {
      return new FtmScanProvider(getFtmScanNetwork(env), FTMSCAN_API_KEY);
    }
    case EvmEcosystemId.Aurora: {
      return new AuroraScanProvider(
        getAuroraScanNetwork(env),
        AURORASCAN_API_KEY,
      );
    }
    default:
      throw new Error(`Unsupported EVM ecosystem: ${ecosystemId}`);
  }
};

export const getProvider = (
  env: Env,
  { ecosystem, rpcUrls }: EvmSpec,
): Provider => {
  if (!isEcosystemEnabled(ecosystem)) {
    return new LocalProvider(rpcUrls[0]);
  }
  switch (ecosystem) {
    case EvmEcosystemId.Acala:
      return new LocalProvider(rpcUrls[0]);
    case EvmEcosystemId.Aurora:
    case EvmEcosystemId.Fantom:
    case EvmEcosystemId.Bnb:
    case EvmEcosystemId.Avalanche:
    case EvmEcosystemId.Ethereum:
    case EvmEcosystemId.Polygon:
      switch (env) {
        case Env.Mainnet:
        case Env.Devnet:
          return getPublicProvider(env, ecosystem);
        default: {
          return new LocalProvider(rpcUrls[0]);
        }
      }
    case EvmEcosystemId.Karura:
      switch (env) {
        case Env.Mainnet:
          return getPublicProvider(env, ecosystem);
        case Env.Devnet:
        default: {
          return new LocalProvider(rpcUrls[0]);
        }
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

    const chainSpec = findOrThrow(
      chains[Protocol.Evm],
      (chain) => chain.ecosystem === ecosystemId,
    );
    const provider = getProvider(env, chainSpec);
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
