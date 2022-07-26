import { Env } from "@swim-io/core";

import { CONFIGS, overrideLocalIp } from "../../config";
import type { EnvironmentState } from "../store";

export const DEFAULT_ENV = Env.Mainnet;

export const selectEnvs = (state: EnvironmentState) =>
  state.customIp === null ? [DEFAULT_ENV] : Object.values(Env);

export const selectConfig = (state: EnvironmentState) => {
  if (state.env !== Env.Custom) {
    return CONFIGS[state.env];
  }
  const config =
    state.customIp === null
      ? CONFIGS[Env.Local]
      : overrideLocalIp(CONFIGS[Env.Local], state.customIp);
  return config;
};
