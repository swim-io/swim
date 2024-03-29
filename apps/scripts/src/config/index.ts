import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { ChainsByProtocol } from "./chains";
import { CHAINS } from "./chains";
import type { TokenConfig } from "./tokens";
import { TOKENS } from "./tokens";

export * from "./chains";
export * from "./ecosystem";
export * from "./tokens";

export interface Config {
  readonly chains: ChainsByProtocol;
  readonly tokens: readonly TokenConfig[];
}

const buildConfig = (env: Env): Config => ({
  chains: CHAINS[env],
  tokens: TOKENS[env],
});

export const CONFIGS: ReadonlyRecord<Env, Config> = {
  [Env.Mainnet]: buildConfig(Env.Mainnet),
  [Env.Devnet]: buildConfig(Env.Devnet),
  [Env.Local]: buildConfig(Env.Local),
  [Env.Custom]: buildConfig(Env.Custom),
};
