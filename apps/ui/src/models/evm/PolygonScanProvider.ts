import { ethers } from "ethers";

import { EvmChainId } from "../../config";
import { findOrThrow } from "../../utils";

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

export class PolygonScanProvider extends ethers.providers.EtherscanProvider {
  public constructor(network?: PolygonNetwork, apiKey?: string) {
    const standardNetwork = network
      ? findOrThrow(networks, ({ name }) => name === network)
      : PolygonNetwork.Mainnet;

    super(standardNetwork, apiKey);
  }

  public getBaseUrl(): string {
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
