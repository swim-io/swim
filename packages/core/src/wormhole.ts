import { Env } from "./env";

/** Adapted from @certusone/wormhole-sdk ChainId
 * https://pkg.go.dev/github.com/certusone/wormhole/node/pkg/vaa#ChainID
 */
export enum WormholeChainId {
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

/** Configuration interface for Wormhole-supported blockchains */
export interface WormholeChainConfig {
  /** The core (generic) VAA bridge contract */
  readonly bridge: string;
  /** The portal token bridge application contract */
  readonly portal: string;
}

export interface WormholeConfig {
  readonly rpcUrls: readonly string[];
}

/** Taken from https://docs.wormholenetwork.com/wormhole/contracts#public-guardian-rpcs */
const mainnet: WormholeConfig = {
  rpcUrls: [
    "https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet.01node.com",
  ],
};

/** Taken from https://docs.wormholenetwork.com/wormhole/contracts#public-guardian-rpcs-1 */
const devnet: WormholeConfig = {
  rpcUrls: ["https://wormhole-v2-testnet-api.certus.one"],
};

const localnet: WormholeConfig = {
  rpcUrls: ["http://127.0.0.1:7071"],
};

export const wormholeConfigs: ReadonlyMap<Env, WormholeConfig> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
  [Env.Local, localnet],
]);
