import { Env } from "@swim-io/core-types";

export interface WormholeConfig {
  readonly rpcUrls: readonly string[];
}

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
