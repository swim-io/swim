import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export const auroraChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 1313161554,
  [Env.Devnet]: 1313161555,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Aurora> = {
  name: "Aurora Mainnet",
  chainId: auroraChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
  },
  publicRpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Aurora> = {
  name: "Aurora Testnet",
  chainId: auroraChainId[Env.Devnet],
  wormhole: {
    bridge: "0xBd07292de7b505a4E803CEe286184f7Acf908F5e",
    portal: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
  },
  publicRpcUrls: ["https://testnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, EvmChainConfig<EvmEcosystemId.Aurora>> = new Map(
  [
    [Env.Mainnet, mainnet],
    [Env.Devnet, devnet],
  ],
);

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const aurora: EvmEcosystemConfig<EvmEcosystemId.Aurora> = {
  id: EvmEcosystemId.Aurora,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 9,
  displayName: "Aurora",
  gasToken,
  chains,
};
