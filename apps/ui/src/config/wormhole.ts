import type { ReadonlyRecord } from "../utils";

import { Env } from "./env";

/** Adapted from @certusone/wormhole-sdk ChainId
 * https://pkg.go.dev/github.com/certusone/wormhole/node/pkg/vaa#ChainID
 */
export const enum WormholeChainId {
  Solana = 1,
  Ethereum = 2,
  Terra = 3,
  Bsc = 4,
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
  readonly endpoint: string;
}

const mainnetWormholeConfig: WormholeConfig = {
  endpoint: "https://wormhole-v2-mainnet-api.certus.one",
};

const devnetWormholeConfig: WormholeConfig = {
  endpoint: "https://wormhole-v2-testnet-api.certus.one",
};

const localnetWormholeConfig: WormholeConfig = {
  endpoint: "http://127.0.0.1:7071",
};

export const wormholeConfigs: ReadonlyRecord<Env, WormholeConfig> = {
  [Env.Mainnet]: mainnetWormholeConfig,
  [Env.Devnet]: devnetWormholeConfig,
  [Env.Localnet]: localnetWormholeConfig,
  [Env.CustomLocalnet]: localnetWormholeConfig,
};
