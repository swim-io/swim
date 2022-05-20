/* eslint-disable functional/immutable-data */
import { produce } from "immer";
import type { Draft } from "immer";
import create from "zustand";
import type { GetState, SetState, StoreApi } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist, subscribeWithSelector } from "zustand/middleware.js";

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
  readonly envs: readonly Env[];
  readonly config: Config;
  readonly customLocalnetIp: string | null;
  readonly _hasHydrated: boolean;
  readonly setHasHydrated: (isHydrated: boolean) => void;
  readonly setEnv: (newEnv: Env) => void;
  readonly setCustomLocalnetIp: (ip: string | null) => void;
}

const getConfig = (env: Env, ip: string | null): Draft<Config> => {
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
  subscribeWithSelector(
    persist(
      (set: SetState<any>, get: GetState<any>, api: StoreApi<any>) => ({
        env: DEFAULT_ENV,
        envs: [DEFAULT_ENV],
        customLocalnetIp: null,
        config: configs[DEFAULT_ENV],
        _hasHydrated: false,
        setHasHydrated: (isHydrated: boolean) => {
          set(
            produce<EnvironmentState>((draft) => {
              draft._hasHydrated = isHydrated;
              get().setConfig();
            }),
          );
        },
        setConfig: () => {
          set(
            produce<EnvironmentState>((draft) => {
              console.log("called on refresh", get().config);
              draft.config = getConfig(
                api.getState().env,
                api.getState().customLocalnetIp,
              );
            }),
          );
        },
        setEnv: (newEnv: Env) => {
          set(
            produce<EnvironmentState>((draft) => {
              if (
                isValidEnv(newEnv) &&
                api.getState().customLocalnetIp !== null
              ) {
                draft.env = newEnv;
                draft.envs = Object.values(Env);
                draft.config = getConfig(
                  newEnv,
                  api.getState().customLocalnetIp,
                );
              } else {
                draft.env = get().env;
                draft.envs = get().envs;
                draft.config = get().config;
              }
            }),
          );
        },
        setCustomLocalnetIp: (ip: string | null) => {
          set(
            produce<EnvironmentState>((draft) => {
              draft.customLocalnetIp = ip;
              draft.envs = ip === null ? [DEFAULT_ENV] : Object.values(Env);
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
        getStorage: (): StateStorage => ({
          getItem: (name) => {
            console.log("get item", name);
            return "getItem";
          },
          setItem: (name: string, value: string): void => {
            console.log("set Item", name, value);
          },
          removeItem: (name: string) => {
            console.log("remove", name);
          },
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
        partialize: (state: EnvironmentState) => ({
          env: state.env,
          envs: state.envs,
          customLocalnetIp: state.customLocalnetIp,
        }),
      },
    ),
  ),
);
