import type { EnvironmentState } from "../store";

export const envSelector = (state: EnvironmentState) => state.env;
export const envsSelector = (state: EnvironmentState) => state.envs;
export const configSelector = (state: EnvironmentState) => state.config;
export const customLocalnetIpSelector = (state: EnvironmentState) =>
  state.customLocalnetIp;
export const setEnvSelector = (state: EnvironmentState) => state.setEnv;
export const setCustomLocalnetIpSelector = (state: EnvironmentState) =>
  state.setCustomLocalnetIp;
