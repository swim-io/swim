import type { Env } from "@swim-io/core";
import { isValidEnv } from "@swim-io/core";
import { produce } from "immer";
import create from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware.js";

import { DEFAULT_ENV } from "../selectors";

export interface EnvironmentState {
  readonly env: Env;
  readonly customIp: string | null;
  readonly setEnv: (newEnv: Env) => void;
  readonly setCustomIp: (ip: string | null) => void;
}

export const useEnvironment = create(
  // eslint-disable-next-line functional/prefer-readonly-type
  persist<EnvironmentState, [], [], Pick<EnvironmentState, "env" | "customIp">>(
    (set, get) => ({
      env: DEFAULT_ENV,
      customIp: null,
      setEnv: (newEnv: Env) => {
        set(
          produce<EnvironmentState>((draft) => {
            if (get().customIp !== null) {
              draft.env = newEnv;
            }
          }),
        );
      },
      setCustomIp: (ip: string | null) => {
        set(
          produce<EnvironmentState>((draft) => {
            draft.customIp = ip;
            draft.env = isValidEnv(get().env) ? get().env : DEFAULT_ENV;
          }),
        );
      },
    }),
    {
      name: "env-config",
      getStorage: (): StateStorage => localStorage,
      partialize: (state: EnvironmentState) => ({
        env: state.env,
        customIp: state.customIp,
      }),
      merge: (
        persistedState: unknown,
        currentState: EnvironmentState,
      ): EnvironmentState => {
        if (typeof persistedState !== "object" || persistedState === null) {
          return currentState;
        }

        const { env, customIp } = persistedState as Record<string, unknown>;
        if (typeof env === "string" && isValidEnv(env)) {
          if (typeof customIp === "string") {
            return { ...currentState, env, customIp };
          }
          return { ...currentState, ...persistedState };
        }

        return currentState;
      },
    },
  ),
);
