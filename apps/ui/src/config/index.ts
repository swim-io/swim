import type { WormholeConfig } from "@swim-io/core";
import { Env, wormholeConfigs } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { ChainsByProtocol } from "./chains";
import { CHAINS } from "./chains";
import type { Ecosystem, EcosystemId } from "./ecosystem";
import { ECOSYSTEMS } from "./ecosystem";
import type { PoolSpec } from "./pools";
import { POOLS } from "./pools";
import type { TokenConfig } from "./tokens";
import { TOKENS } from "./tokens";

export * from "./chains";
export * from "./ecosystem";
export * from "./i18n";
export * from "./pools";
export * from "./tokens";
export * from "./utils";
export * from "./wormhole";

export interface Config {
  readonly ecosystems: ReadonlyRecord<EcosystemId, Ecosystem>;
  readonly chains: ChainsByProtocol;
  readonly pools: readonly PoolSpec[];
  readonly tokens: readonly TokenConfig[];
  readonly wormhole: WormholeConfig | null;
}

const buildConfig = (env: Env): Config => ({
  ecosystems: ECOSYSTEMS,
  chains: CHAINS[env],
  pools: POOLS[env],
  tokens: TOKENS[env],
  wormhole: wormholeConfigs.get(env) ?? null,
});

export const CONFIGS: ReadonlyRecord<Env, Config> = {
  [Env.Mainnet]: buildConfig(Env.Mainnet),
  [Env.Testnet]: buildConfig(Env.Testnet),
  [Env.Local]: buildConfig(Env.Local),
  [Env.Custom]: buildConfig(Env.Custom),
};
