import type { ReadonlyRecord } from "../utils";

import type { ChainsByProtocol } from "./chains";
import { CHAINS } from "./chains";
import type { Ecosystem, EcosystemId } from "./ecosystem";
import { ECOSYSTEMS, Protocol } from "./ecosystem";
import { Env } from "./env";
import type { PoolSpec } from "./pools";
import { POOLS } from "./pools";
import { REDEEMER } from "./redeemer";
import type { RedeemerSpec } from "./redeemer";
import type { TokenSpec } from "./tokens";
import { TOKENS } from "./tokens";
import type { WormholeConfig } from "./wormhole";
import { WORMHOLE_CONFIGS } from "./wormhole";

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
  ecosystems: ECOSYSTEMS,
  chains: CHAINS[env],
  pools: POOLS[env],
  tokens: TOKENS[env],
  wormhole: WORMHOLE_CONFIGS[env],
  redeemer: REDEEMER[env],
});

export const CONFIGS: ReadonlyRecord<Env, Config> = {
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
