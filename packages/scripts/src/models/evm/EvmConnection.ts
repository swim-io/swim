
import { BscscanProvider } from "@ethers-ancillary/bsc";

import { ethers } from "ethers";
import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";

import { AuroraNetwork, AuroraScanProvider } from "./AuroraScanProvider";
import { FantomNetwork, FtmScanProvider } from "./FtmScanProvider";
import { LocalProvider } from "./LocalProvider";
import { MoralisProvider } from "./MoralisProvider";
import { PolkadotProvider } from "./PolkadotProvider";
import { PolygonNetwork, PolygonScanProvider } from "./PolygonScanProvider";
import { AvalancheNetwork, SnowTraceProvider } from "./SnowTraceProvider";

import type { EvmSpec } from "../../config";
import { isEcosystemEnabled } from "../../config";

type EtherscanProvider = ethers.providers.EtherscanProvider;
type TransactionReceipt = ethers.providers.TransactionReceipt;

export type Provider =
  | MoralisProvider
  | EtherscanProvider
  | LocalProvider
  | PolkadotProvider;

const {
  BNB_TESTNET_RPC_URL,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  FTMSCAN_API_KEY,
  AURORASCAN_API_KEY,
  SNOWTRACE_API_KEY,
} = process.env;

const MORALIS_ID = "Swim UI";

/**
 * Network names from:
 * https://github.com/ethers-io/ethers.js/blob/7b134bd5c9f07f60b2e38b110268042e10f68174/packages/providers/src.ts/alchemy-provider.ts#L57-L93
 */
const getEtherscanNetwork = (env: Env): ethers.providers.Networkish => {
  switch (env) {
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
    case Env.Devnet:
      return "bsc-testnet";
    default:
      throw new Error(`Bscscan does not support ${env}`);
  }
};

const getPolygonScanNetwork = (env: Env): PolygonNetwork => {
  switch (env) {
    case Env.Devnet:
      return PolygonNetwork.Testnet;
    default:
      throw new Error(`PolygonScan does not support ${env}`);
  }
};

const getSnowTraceNetwork = (env: Env): AvalancheNetwork => {
  switch (env) {
    case Env.Devnet:
      return AvalancheNetwork.Testnet;
    default:
      throw new Error(`SnowTrace does not support ${env}`);
  }
};

// TODO: Move this function to FtmScanProvider.ts
const getFtmScanNetwork = (env: Env): FantomNetwork => {
  switch (env) {
    case Env.Devnet:
      return FantomNetwork.Testnet;
    default:
      throw new Error(`FtmScan does not support ${env}`);
  }
};

const getAuroraScanNetwork = (env: Env): AuroraNetwork => {
  switch (env) {
    case Env.Devnet:
      return AuroraNetwork.Testnet;
    default:
      throw new Error(`AuroraScan does not support ${env}`);
  }
};

const getBnbRpcUrl = (env: Env): string => {
  switch (env) {
    case Env.Devnet:
      if (BNB_TESTNET_RPC_URL === undefined) {
        throw new Error("BNB_TESTNET_RPC_URL is not set");
      }
      return BNB_TESTNET_RPC_URL;
    default:
      throw new Error(`${env} not supported by Moralis Provider`);
  }
};

const getKaruraProvider = (env: Env): string => {
  switch (env) {
    case Env.Devnet:
    default:
      throw new Error(
        `Karura provider (AcalaProvider) does not support ${env}`,
      );
  }
};

const getKaruraSubQl = (env: Env): string => {
  switch (env) {
    case Env.Devnet:
    default:
      throw new Error(`Karura SubQL does not support ${env}`);
  }
};

export class EvmConnection {
  public provider: Provider;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txReceiptCache: Map<string, TransactionReceipt>;

  constructor(env: Env, chainSpec: EvmSpec) {
    this.provider = EvmConnection.getIndexerProvider(env, chainSpec);
    this.txReceiptCache = new Map();
  }

  public static getIndexerProvider(
    env: Env,
    { ecosystem, rpcUrls }: EvmSpec,
  ): Provider {
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
            return EvmConnection.getPublicEvmIndexerProvider(env, ecosystem);
          default: {
            return new LocalProvider(rpcUrls[0]);
          }
        }
      case EvmEcosystemId.Karura:
        switch (env) {
          case Env.Mainnet:
            return EvmConnection.getPublicEvmIndexerProvider(env, ecosystem);
          case Env.Devnet:
          default: {
            return new LocalProvider(rpcUrls[0]);
          }
        }
    }
  }

  private static getPublicEvmIndexerProvider(
    env: Env,
    ecosystemId: EvmEcosystemId,
  ): Provider {
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
        return new SnowTraceProvider(
          getSnowTraceNetwork(env),
          SNOWTRACE_API_KEY,
        );
      }
      case EvmEcosystemId.Polygon: {
        return new PolygonScanProvider(
          getPolygonScanNetwork(env),
          POLYGONSCAN_API_KEY,
        );
      }
      case EvmEcosystemId.Karura: {
        return new PolkadotProvider(
          getKaruraProvider(env),
          getKaruraSubQl(env),
        );
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
  }
}
