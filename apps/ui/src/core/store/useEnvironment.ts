/* eslint-disable functional/immutable-data */
import { produce } from "immer";
import type { Draft } from "immer";
import create from "zustand";
import type { GetState, SetState, StoreApi } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type { Config } from "../../config";
import {
  DEFAULT_ENV,
  configs,
  isValidEnv,
  overrideLocalnetIp,
} from "../../config";

export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localnet = "Localnet",
  CustomLocalnet = "CustomLocalnet",
}
export interface EnvironmentState {
  readonly env: Env;
  readonly config: Config;
  readonly customLocalnetIp: string | null;
  readonly setEnv: (newEnv: Env) => void;
  readonly setCustomLocalnetIp: (ip: string | null) => void;
}

export const getConfig = (env: Env, ip: string | null): Draft<Config> => {
  const updatedConfig: Draft<any> = {
    ...configs,
    [Env.CustomLocalnet]:
      ip !== null
        ? overrideLocalnetIp(configs[Env.Localnet], ip)
        : configs[Env.Localnet],
  };
  return updatedConfig[env];
};

export const useEnvironment = create(
  persist<EnvironmentState>(
    (
      set: SetState<EnvironmentState>,
      get: GetState<EnvironmentState>,
      api: StoreApi<EnvironmentState>,
    ) => ({
      env: DEFAULT_ENV,
      config: configs[DEFAULT_ENV],
      customLocalnetIp: null,
      setEnv: (newEnv: Env) => {
        set(
          produce<EnvironmentState>((draft) => {
            if (
              isValidEnv(newEnv) &&
              api.getState().customLocalnetIp !== null
            ) {
              draft.env = newEnv;
              draft.config = getConfig(newEnv, api.getState().customLocalnetIp);
            }
          }),
        );
      },
      setCustomLocalnetIp: (ip: string | null) => {
        set(
          produce<EnvironmentState>((draft) => {
            draft.customLocalnetIp = ip;
            draft.env = isValidEnv(api.getState().env)
              ? api.getState().env
              : DEFAULT_ENV;
            draft.config = getConfig(draft.env, ip);
          }),
        );
      },
    }),
    {
      name: "env-config",
      getStorage: (): StateStorage => localStorage,
      partialize: (state: EnvironmentState) => ({
        env: state.env,
        customLocalnetIp: state.customLocalnetIp,
      }),
      merge: (
        persistedState: any, // TODO: Set type to unknown and validate
        currentState: EnvironmentState,
      ): EnvironmentState => {
        const { env, customLocalnetIp } = persistedState;
        if (isValidEnv(env)) {
          if (customLocalnetIp !== null) {
            const config = getConfig(env, customLocalnetIp);
            return { ...currentState, env, customLocalnetIp, config };
          }
          return { ...currentState, ...persistedState };
        }
        return currentState;
      },
    },
  ),
);
