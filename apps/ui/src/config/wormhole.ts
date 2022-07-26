import { Env } from "@swim-io/core";

import type { ReadonlyRecord } from "../utils";

/** Adapted from @certusone/wormhole-sdk ChainId
 * https://pkg.go.dev/github.com/certusone/wormhole/node/pkg/vaa#ChainID
 */
export const enum WormholeChainId {
  Solana = 1,
  Ethereum = 2,
  Terra = 3,
  Bnb = 4,
  Polygon = 5, // NOTE: in some parts of the code, the listed order is swapped with Avalanche but ID is the same
  Avalanche = 6,
  Oasis = 7,
  Algorand = 8,
  Aurora = 9,
  Fantom = 10,
  Karura = 11,
  Acala = 12,
  Klaytn = 13,
}

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
