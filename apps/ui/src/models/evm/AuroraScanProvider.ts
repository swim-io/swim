import { ethers } from "ethers";

import { findOrThrow } from "../../utils";
import { EvmChainId } from "../../config";

export const enum AuroraNetwork {
  Mainnet = "aurora-mainnet",
  Testnet = "aurora-testnet",
}

const networks = [
  {
    name: AuroraNetwork.Mainnet,
    chainId: EvmChainId.AuroraMainnet,
  },
  {
    name: AuroraNetwork.Testnet,
    chainId: EvmChainId.AuroraTestnet,
  },
];

export class AuroraScanProvider extends ethers.providers.EtherscanProvider {
  public constructor(network?: AuroraNetwork, apiKey?: string) {
    const standardNetwork = network
      ? findOrThrow(networks, ({ name }) => name === network)
      : AuroraNetwork.Mainnet;

    super(standardNetwork, apiKey);
  }

  public getBaseUrl(): string {
    switch (this.network.name) {
      case AuroraNetwork.Mainnet:
        return "https://api.aurorascan.dev/";
      case AuroraNetwork.Testnet:
        return "https://api-testnet.aurorascan.dev/";
      default:
        throw new Error("Unknown network");
    }
  }
}
