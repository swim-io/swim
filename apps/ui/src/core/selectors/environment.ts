import { DEFAULT_ENV, configs, overrideLocalnetIp } from "../../config";
import { Env } from "../store/useEnvironment";
import type { EnvironmentState } from "../store/useEnvironment";

export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);

export const selectConfig = (state: EnvironmentState) => {
  if (state.env !== Env.CustomLocalnet) {
    return configs[state.env];
  }
  const config =
    state.customLocalnetIp === null
      ? configs[Env.Localnet]
      : overrideLocalnetIp(configs[Env.Localnet], state.customLocalnetIp);
  return config;
};
