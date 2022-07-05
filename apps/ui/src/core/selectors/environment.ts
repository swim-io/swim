import { CONFIGS, DEFAULT_ENV, overrideLocalnetIp } from "../../config";
import { Env } from "../store";
import type { EnvironmentState } from "../store";

export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);

export const selectConfig = (state: EnvironmentState) => {
  if (state.env !== Env.CustomLocalnet) {
    return CONFIGS[state.env];
  }
  const config =
    state.customLocalnetIp === null
      ? CONFIGS[Env.Localnet]
      : overrideLocalnetIp(CONFIGS[Env.Localnet], state.customLocalnetIp);
  return config;
};
