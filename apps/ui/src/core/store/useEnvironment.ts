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
              console.log("hidrated", get(), api.getState());
              if (get().customLocalnetIp !== null) {
                console.log("inside config", draft.config);
                draft.config = overrideLocalnetIp(
                  configs[Env.Localnet],
                  get().customLocalnetIp,
                ) as Draft<Config>;
                console.log("changed config", draft.config);
              }
              draft._hasHydrated = isHydrated;
              return draft;
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
                draft.config = overrideLocalnetIp(
                  configs[Env.Localnet],
                  api.getState().customLocalnetIp,
                ) as Draft<Config>;
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
              const newConfig =
                ip !== null
                  ? overrideLocalnetIp(configs[Env.Localnet], ip)
                  : configs[Env.Localnet];
              draft.config = newConfig as Draft<Config>;
              draft.envs = ip === null ? [DEFAULT_ENV] : Object.values(Env);
              draft.env = isValidEnv(api.getState().env)
                ? api.getState().env
                : DEFAULT_ENV;
            }),
          );
        },
      }),
      {
        name: "env-config",
        getStorage: (): StateStorage => localStorage,
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(state._hasHydrated);
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
