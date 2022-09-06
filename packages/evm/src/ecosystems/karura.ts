import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";

import type { EvmChainConfig, EvmEcosystemConfig } from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

import { createChainId } from "./utils/chains";

export const karuraChainId = createChainId({
  [Env.Mainnet]: 686,
  [Env.Devnet]: 596,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Karura> = {
  name: "Karura Mainnet",
  chainId: karuraChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
  },
  publicRpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Karura> = {
  name: "Karura Testnet",
  chainId: karuraChainId[Env.Devnet],
  wormhole: {
    bridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
    portal: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
  },
  publicRpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, EvmChainConfig<EvmEcosystemId.Karura>> = new Map(
  [
    [Env.Mainnet, mainnet],
    [Env.Devnet, devnet],
  ],
);

const gasToken: GasToken = {
  name: "Karura",
  symbol: "KAR",
  decimals: 18,
};

export const karura: EvmEcosystemConfig<EvmEcosystemId.Karura> = {
  id: EvmEcosystemId.Karura,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 11,
  displayName: "Karura",
  gasToken,
  chains,
};
