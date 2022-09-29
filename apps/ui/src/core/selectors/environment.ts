import { Env } from "@swim-io/core";

import { CONFIGS } from "../../config";
import type { EnvironmentState } from "../store";

export const DEFAULT_ENV = Env.Mainnet;

export const selectEnvs = (state: EnvironmentState) =>
  state.customIp === null ? [DEFAULT_ENV] : Object.values(Env);

export const selectConfig = (state: EnvironmentState) => CONFIGS[state.env];
