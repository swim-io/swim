/* eslint-disable import/extensions */
/* eslint-disable functional/immutable-data */
import { produce } from "immer";
import type { Draft } from "immer";
import create from "zustand";
import type { GetState, SetState } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware";

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
  persist(
    (set: SetState<any>, get: GetState<any>) => ({
      env: DEFAULT_ENV,
      envs: [DEFAULT_ENV],
      customLocalnetIp: null,
      config: configs[DEFAULT_ENV],
      _hasHydrated: false,
      setHasHydrated: (isHydrated: boolean) => {
        set({
          _hasHydrated: isHydrated,
        });
      },
      setEnv: (newEnv: Env) => {
        set(
          produce<EnvironmentState>((draft) => {
            draft.env = isValidEnv(newEnv) ? newEnv : get().env;
            draft.envs =
              isValidEnv(newEnv) && get().customLocalnetIp !== null
                ? Object.values(Env)
                : get().envs;
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
            draft.env = isValidEnv(get().env) ? get().env : DEFAULT_ENV;
          }),
        );
      },
    }),
    {
      name: "env-config",
      getStorage: (): StateStorage => ({
        getItem: (name: string): string | null => {
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value);
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(state._hasHydrated);
      },
      partialize: (state) => ({
        env: state.env,
        envs: state.envs,
        customLocalnetIp: state.customLocalnetIp,
      }),
    },
  ),
);
