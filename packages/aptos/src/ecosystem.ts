import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";

import type { AptosChainConfig, AptosEcosystemConfig } from "./protocol";
import { APTOS_ECOSYSTEM_ID, APTOS_PROTOCOL } from "./protocol";

export enum AptosChainId {
  Devnet = 31, // announced in https://discord.com/channels/945856774056083548/956692649430093904
}

const devnet: AptosChainConfig = {
  name: "Aptos Devnet",
  chainId: AptosChainId.Devnet,
  wormhole: {
    bridge: "TODO",
    portal: "TODO",
  },
  publicRpcUrls: ["https://fullnode.devnet.aptoslabs.com/v1"],
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, AptosChainConfig> = new Map([
  [Env.Devnet, devnet],
]);

const gasToken: GasToken = {
  name: "Aptos Coin",
  symbol: "APT",
  decimals: 8,
};

export const aptos: AptosEcosystemConfig = {
  id: APTOS_ECOSYSTEM_ID,
  protocol: APTOS_PROTOCOL,
  wormholeChainId: 22,
  displayName: "Aptos",
  gasToken,
  chains,
};
