import { DEFAULT_ENV } from "../../config";
import type { EnvironmentState } from "../store";
import { Env } from "../store";

export const selectEnv = (state: EnvironmentState) => state.env;
export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);
export const selectConfig = (state: EnvironmentState) => state.config;
export const selectCustomLocalnetIp = (state: EnvironmentState) =>
  state.customLocalnetIp;
export const selectSetEnv = (state: EnvironmentState) => state.setEnv;
export const selectSetCustomLocalnetIp = (state: EnvironmentState) =>
  state.setCustomLocalnetIp;
