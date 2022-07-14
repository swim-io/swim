import type { ReadonlyRecord } from "../utils";

import { Env } from "@swim-io/core-types";

export interface WormholeConfig {
  readonly endpoint: string;
}

const MAINNET_WORMHOLE_CONFIG: WormholeConfig = {
  // endpoint: "https://wormhole-v2-mainnet-api.certus.one",
  endpoint: " https://wormhole.inotel.ro",
};

const DEVNET_WORMHOLE_CONFIG: WormholeConfig = {
  endpoint: "https://wormhole-v2-testnet-api.certus.one",
};

const LOCALNET_WORMHOLE_CONFIG: WormholeConfig = {
  endpoint: "http://127.0.0.1:7071",
};

export const WORMHOLE_CONFIGS: ReadonlyRecord<Env, WormholeConfig> = {
  [Env.Mainnet]: MAINNET_WORMHOLE_CONFIG,
  [Env.Devnet]: DEVNET_WORMHOLE_CONFIG,
  [Env.Local]: LOCALNET_WORMHOLE_CONFIG,
  [Env.Custom]: LOCALNET_WORMHOLE_CONFIG,
};
