import { Env } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import { ethers } from "ethers";

import { EvmChainId } from "../../config";

export const enum FantomNetwork {
  Mainnet = "fantom-mainnet",
  Testnet = "fantom-testnet",
}

const networks = [
  {
    name: FantomNetwork.Mainnet,
    chainId: EvmChainId.FantomMainnet,
  },
  {
    name: FantomNetwork.Testnet,
    chainId: EvmChainId.FantomTestnet,
  },
];

export const getFtmScanNetwork = (env: Env): FantomNetwork => {
  switch (env) {
    case Env.Mainnet:
      return FantomNetwork.Mainnet;
    case Env.Devnet:
      return FantomNetwork.Testnet;
    default:
      throw new Error(`FtmScan does not support ${env}`);
  }
};

export class FtmScanProvider extends ethers.providers.EtherscanProvider {
  public constructor(network?: FantomNetwork, apiKey?: string) {
    const standardNetwork = network
      ? findOrThrow(networks, ({ name }) => name === network)
      : FantomNetwork.Mainnet;

    super(standardNetwork, apiKey);
  }

  public override getBaseUrl(): string {
    switch (this.network.name) {
      case FantomNetwork.Mainnet:
        return "https://api.ftmscan.com/";
      case FantomNetwork.Testnet:
        return "https://api-testnet.ftmscan.com/";
      default:
        throw new Error("Unknown network");
    }
  }
}
