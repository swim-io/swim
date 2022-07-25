import { produce } from "immer";
import create from "zustand";
import type { GetState, SetState, StoreApi } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import type { Env } from "../../config";
import { DEFAULT_ENV, isValidEnv } from "../../config";

export interface EnvironmentState {
  readonly env: Env;
  readonly customLocalnetIp: string | null;
  readonly setEnv: (newEnv: Env) => void;
  readonly setCustomLocalnetIp: (ip: string | null) => void;
}

export const useEnvironment = create(
  persist<EnvironmentState>(
    (
      set: SetState<EnvironmentState>,
      get: GetState<EnvironmentState>,
      api: StoreApi<EnvironmentState>,
    ) => ({
      env: DEFAULT_ENV,
      customLocalnetIp: null,
      setEnv: (newEnv: Env) => {
        set(
          produce<EnvironmentState>((draft) => {
            if (api.getState().customLocalnetIp !== null) {
              draft.env = newEnv;
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
            return { ...currentState, env, customLocalnetIp };
          }
          return { ...currentState, ...persistedState };
        }
        return currentState;
      },
    },
  ),
);
