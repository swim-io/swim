import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";

import type { EvmChainConfig, EvmEcosystemConfig } from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export enum FantomChainId {
  Mainnet = 250,
  Testnet = 4002,
}

const mainnet: EvmChainConfig<EvmEcosystemId.Fantom> = {
  name: "Fantom Mainnet",
  chainId: FantomChainId.Mainnet,
  wormhole: {
    bridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
    portal: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
  },
  publicRpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Fantom> = {
  name: "Fantom Testnet",
  chainId: FantomChainId.Testnet,
  wormhole: {
    bridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
    portal: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
  },
  publicRpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, EvmChainConfig<EvmEcosystemId.Fantom>> = new Map(
  [
    [Env.Mainnet, mainnet],
    [Env.Devnet, devnet],
  ],
);

const gasToken: GasToken = {
  name: "FTM",
  symbol: "FTM",
  decimals: 18,
};

export const fantom: EvmEcosystemConfig<EvmEcosystemId.Fantom> = {
  id: EvmEcosystemId.Fantom,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 10,
  displayName: "Fantom",
  gasToken,
  chains,
};
