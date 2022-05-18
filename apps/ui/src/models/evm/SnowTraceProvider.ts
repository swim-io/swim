import { ethers } from "ethers";

import { findOrThrow } from "../../utils";

export const enum AvalancheNetwork {
  Mainnet = "avalanche-mainnet",
  Testnet = "avalanche-testnet",
}

const networks = [
  {
    name: AvalancheNetwork.Mainnet,
    chainId: 43114,
  },
  {
    name: AvalancheNetwork.Testnet,
    chainId: 43113,
  },
];

export class SnowTraceProvider extends ethers.providers.EtherscanProvider {
  public constructor(network?: AvalancheNetwork, apiKey?: string) {
    const standardNetwork = network
      ? findOrThrow(networks, ({ name }) => name === network)
      : AvalancheNetwork.Mainnet;

    super(standardNetwork, apiKey);
  }

  public getBaseUrl(): string {
    switch (this.network.name) {
      case AvalancheNetwork.Mainnet:
        return "https://api.snowtrace.io";
      case AvalancheNetwork.Testnet:
        return "https://api-testnet.snowtrace.io";
      default:
        throw new Error("Unknown network");
    }
  }
}
