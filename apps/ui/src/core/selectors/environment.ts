import { DEFAULT_ENV } from "../../config";
import { Env } from "../store";
import type { EnvironmentState } from "../store";

export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);
