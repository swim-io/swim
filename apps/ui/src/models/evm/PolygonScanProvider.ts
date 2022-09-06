import { Env } from "@swim-io/core";
import { findOrThrow } from "@swim-io/utils";
import { ethers } from "ethers";

import { EvmChainId } from "../../config";

export const enum PolygonNetwork {
  Mainnet = "polygon-mainnet",
  Testnet = "polygon-testnet",
}

const networks = [
  {
    name: PolygonNetwork.Mainnet,
    chainId: EvmChainId.PolygonMainnet,
  },
  {
    name: PolygonNetwork.Testnet,
    chainId: EvmChainId.PolygonTestnet,
  },
];

export const getPolygonScanNetwork = (env: Env): PolygonNetwork => {
  switch (env) {
    case Env.Mainnet:
      return PolygonNetwork.Mainnet;
    case Env.Devnet:
      return PolygonNetwork.Testnet;
    default:
      throw new Error(`PolygonScan does not support ${env}`);
  }
};

export class PolygonScanProvider extends ethers.providers.EtherscanProvider {
  public constructor(network?: PolygonNetwork, apiKey?: string) {
    const standardNetwork = network
      ? findOrThrow(networks, ({ name }) => name === network)
      : PolygonNetwork.Mainnet;

    super(standardNetwork, apiKey);
  }

  public override getBaseUrl(): string {
    switch (this.network.name) {
      case PolygonNetwork.Mainnet:
        return "https://api.polygonscan.com/";
      case PolygonNetwork.Testnet:
        return "https://api-testnet.polygonscan.com/";
      default:
        throw new Error("Unknown network");
    }
  }
}
