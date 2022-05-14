import { ethers } from "ethers";

import { findOrThrow } from "../../utils";

export const enum PolygonNetwork {
  Mainnet = "polygon-mainnet",
  Testnet = "polygon-testnet",
}

const networks = [
  {
    name: PolygonNetwork.Mainnet,
    chainId: 137,
  },
  {
    name: PolygonNetwork.Testnet,
    chainId: 80001,
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
