import { Env } from "@swim-io/core";

import { CONFIGS, overrideLocalnetIp } from "../../config";
import type { EnvironmentState } from "../store";

export const DEFAULT_ENV = Env.Mainnet;

export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);

export const selectConfig = (state: EnvironmentState) => {
  if (state.env !== Env.Custom) {
    return CONFIGS[state.env];
  }
  const config =
    state.customLocalnetIp === null
      ? CONFIGS[Env.Local]
      : overrideLocalnetIp(CONFIGS[Env.Local], state.customLocalnetIp);
  return config;
};
