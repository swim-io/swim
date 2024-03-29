import { Env } from "./env";

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
const testnet: WormholeConfig = {
  rpcUrls: ["https://wormhole-v2-testnet-api.certus.one"],
};

const local: WormholeConfig = {
  rpcUrls: ["http://127.0.0.1:7071"],
};

export const wormholeConfigs: ReadonlyMap<Env, WormholeConfig> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Testnet, testnet],
  [Env.Local, local],
]);
