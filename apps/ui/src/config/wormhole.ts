import { Env } from "@swim-io/core-types";

import type { ReadonlyRecord } from "../utils";

export interface WormholeConfig {
  readonly rpcUrls: readonly string[];
}

const MAINNET_WORMHOLE_CONFIG: WormholeConfig = {
  rpcUrls: [
    "https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet.01node.com",
  ],
};

const DEVNET_WORMHOLE_CONFIG: WormholeConfig = {
  rpcUrls: ["https://wormhole-v2-testnet-api.certus.one"],
};

const LOCALNET_WORMHOLE_CONFIG: WormholeConfig = {
  rpcUrls: ["http://127.0.0.1:7071"],
};

export const WORMHOLE_CONFIGS: ReadonlyRecord<Env, WormholeConfig> = {
  [Env.Mainnet]: MAINNET_WORMHOLE_CONFIG,
  [Env.Devnet]: DEVNET_WORMHOLE_CONFIG,
  [Env.Local]: LOCALNET_WORMHOLE_CONFIG,
  [Env.Custom]: LOCALNET_WORMHOLE_CONFIG,
};
