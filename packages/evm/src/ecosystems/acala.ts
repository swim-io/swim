import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export const acalaChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 787,
  [Env.Testnet]: 597,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Acala> = {
  name: "Acala Mainnet",
  chainId: acalaChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
  },
  publicRpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Acala> = {
  name: "Acala Testnet",
  chainId: acalaChainId[Env.Testnet],
  wormhole: {
    bridge: "0x4377B49d559c0a9466477195C6AdC3D433e265c0",
    portal: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
  },
  publicRpcUrls: ["https://acala-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Acala",
  symbol: "ACA",
  decimals: 18,
};

export const acala = assertType<EvmEcosystemConfig<EvmEcosystemId.Acala>>()({
  id: EvmEcosystemId.Acala,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 12,
  displayName: "Acala",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
