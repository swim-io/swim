import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import { logger, providers } from "ethers";

import { aurora, bnb, ethereum, fantom, polygon } from "../ecosystems";
import { EvmEcosystemId } from "../protocol";

type Network = providers.Network;
type EtherscanFamilyNetworks = ReadonlyRecord<
  Env.Mainnet | Env.Devnet,
  Network
>;
const EtherscanProvider = providers.EtherscanProvider;

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const ETHEREUM_NETWORKS: EtherscanFamilyNetworks = {
  [Env.Mainnet]: {
    name: "homestead",
    chainId: ethereum.chains.get(Env.Mainnet)!.chainId,
  },
  [Env.Devnet]: {
    name: "goerli",
    chainId: ethereum.chains.get(Env.Devnet)!.chainId,
  },
};

const BNB_NETWORKS: EtherscanFamilyNetworks = {
  [Env.Mainnet]: {
    name: "bsc-mainnet",
    chainId: bnb.chains.get(Env.Mainnet)!.chainId,
  },
  [Env.Devnet]: {
    name: "bsc-testnet",
    chainId: bnb.chains.get(Env.Devnet)!.chainId,
  },
};

const AURORA_NETWORKS: EtherscanFamilyNetworks = {
  [Env.Mainnet]: {
    name: "aurora-mainnet",
    chainId: aurora.chains.get(Env.Mainnet)!.chainId,
  },
  [Env.Devnet]: {
    name: "aurora-testnet",
    chainId: aurora.chains.get(Env.Devnet)!.chainId,
  },
};

const FANTOM_NETWORKS: EtherscanFamilyNetworks = {
  [Env.Mainnet]: {
    name: "fantom-mainnet",
    chainId: fantom.chains.get(Env.Mainnet)!.chainId,
  },
  [Env.Devnet]: {
    name: "fantom-testnet",
    chainId: fantom.chains.get(Env.Devnet)!.chainId,
  },
};

const POLYGON_NETWORKS: EtherscanFamilyNetworks = {
  [Env.Mainnet]: {
    name: "polygon-mainnet",
    chainId: polygon.chains.get(Env.Mainnet)!.chainId,
  },
  [Env.Devnet]: {
    name: "polygon-testnet",
    chainId: polygon.chains.get(Env.Devnet)!.chainId,
  },
};
/* eslint-enable @typescript-eslint/no-non-null-assertion */

const NETWORKS: ReadonlyMap<EvmEcosystemId, EtherscanFamilyNetworks> = new Map([
  [EvmEcosystemId.Ethereum, ETHEREUM_NETWORKS],
  [EvmEcosystemId.Bnb, BNB_NETWORKS],
  [EvmEcosystemId.Aurora, AURORA_NETWORKS],
  [EvmEcosystemId.Fantom, FANTOM_NETWORKS],
  [EvmEcosystemId.Polygon, POLYGON_NETWORKS],
]);

const ETHEREUM_BASE_URLS = {
  homestead: "https://api.etherscan.io",
  goerli: "https://api-goerli.etherscan.io",
};

const BNB_BASE_URLS = {
  "bsc-mainnet": "http://api.bscscan.com",
  "bsc-testnet": "http://api-testnet.bscscan.com",
};

const AURORA_BASE_URLS = {
  "aurora-mainnet": "https://api.aurorascan.dev",
  "aurora-testnet": "https://api-testnet.aurorascan.dev",
};

const FANTOM_BASE_URLS = {
  "fantom-mainnet": "https://api.ftmscan.com",
  "fantom-testnet": "https://api-testnet.ftmscan.com",
};

const POLYGON_BASE_URLS = {
  "polygon-mainnet": "https://api.polygonscan.com",
  "polygon-testnet": "https://api-testnet.polygonscan.com",
};

const BASE_URLS: ReadonlyRecord<string, string | undefined> = {
  ...ETHEREUM_BASE_URLS,
  ...BNB_BASE_URLS,
  ...AURORA_BASE_URLS,
  ...FANTOM_BASE_URLS,
  ...POLYGON_BASE_URLS,
};

/** Extends EtherscanProvider with base URLs for other Etherscan-family services */
export class EtherscanFamilyProvider extends EtherscanProvider {
  public override getBaseUrl(): string {
    // Etherscan does not use strict mode so this check is probably necessary
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.network) {
      throw new Error("Unknown network");
    }
    const baseUrl = BASE_URLS[this.network.name] ?? null;
    if (baseUrl === null) {
      return logger.throwArgumentError(
        "unsupported network",
        "network",
        this.network.name,
      );
    }
    return baseUrl;
  }
}

export const getEtherscanFamilyNetwork = (
  env: Env.Mainnet | Env.Devnet,
  ecosystemId: EvmEcosystemId,
): Network | null => NETWORKS.get(ecosystemId)?.[env] ?? null;
