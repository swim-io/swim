import type { ReadonlyRecord } from "../utils";

import type { ChainsByProtocol } from "./chains";
import { chains } from "./chains";
import type { Ecosystem, EcosystemId } from "./ecosystem";
import { Protocol, ecosystems } from "./ecosystem";
import { Env } from "./env";
import type { PoolSpec } from "./pools";
import { pools } from "./pools";
import { redeemer } from "./redeemer";
import type { RedeemerSpec } from "./redeemer";
import type { TokenSpec } from "./tokens";
import { tokens } from "./tokens";
import type { WormholeConfig } from "./wormhole";
import { wormholeConfigs } from "./wormhole";

export * from "./chains";
export * from "./ecosystem";
export * from "./env";
export * from "./pools";
export * from "./tokens";
export * from "./utils";
export * from "./wormhole";

export interface Config {
  readonly ecosystems: ReadonlyRecord<EcosystemId, Ecosystem>;
  readonly chains: ChainsByProtocol;
  readonly pools: readonly PoolSpec[];
  readonly tokens: readonly TokenSpec[];
  readonly wormhole: WormholeConfig;
  readonly redeemer: RedeemerSpec;
}

const buildConfig = (env: Env): Config => ({
  ecosystems: ecosystems,
  chains: chains[env],
  pools: pools[env],
  tokens: tokens[env],
  wormhole: wormholeConfigs[env],
  redeemer: redeemer[env],
});

export const configs: ReadonlyRecord<Env, Config> = {
  [Env.Mainnet]: buildConfig(Env.Mainnet),
  [Env.Devnet]: buildConfig(Env.Devnet),
  [Env.Localnet]: buildConfig(Env.Localnet),
  [Env.CustomLocalnet]: buildConfig(Env.CustomLocalnet),
};

const LOCALHOST_REGEXP = /localhost|127\.0\.0\.1/;

export const overrideLocalnetIp = (config: Config, ip: string): Config => ({
  ...config,
  wormhole: {
    ...config.wormhole,
    endpoint: config.wormhole.endpoint.replace(LOCALHOST_REGEXP, ip),
  },
  chains: {
    ...config.chains,
    [Protocol.Solana]: [
      {
        ...config.chains[Protocol.Solana][0],
        endpoint: config.chains[Protocol.Solana][0].endpoint.replace(
          LOCALHOST_REGEXP,
          ip,
        ),
      },
      ...config.chains[Protocol.Solana].slice(1),
    ],
    [Protocol.Evm]: config.chains[Protocol.Evm].map((chainSpec) => ({
      ...chainSpec,
      rpcUrls: chainSpec.rpcUrls.map((rpcUrl) =>
        rpcUrl.replace(LOCALHOST_REGEXP, ip),
      ),
    })),
  },
});
