import type { EnvironmentState } from "../store";

export const selectEnv = (state: EnvironmentState) => state.env;
export const selectEnvs = (state: EnvironmentState) => state.envs;
export const selectConfig = (state: EnvironmentState) => state.config;
export const selectCustomLocalnetIp = (state: EnvironmentState) =>
  state.customLocalnetIp;
export const selectSetEnv = (state: EnvironmentState) => state.setEnv;
export const selectSetCustomLocalnetIp = (state: EnvironmentState) =>
  state.setCustomLocalnetIp;
