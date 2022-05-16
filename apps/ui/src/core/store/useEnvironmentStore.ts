/* eslint-disable functional/immutable-data */
import produce from "immer";
import create from "zustand";

import type { Config } from "../../config";
import { configs, overrideLocalnetIp } from "../../config";

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
  readonly setEnv: (newEnv: Env) => void;
  readonly setCustomLocalnetIp: (ip: string | null) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  env: Env.Mainnet,
  envs: [Env.Mainnet],
  config: configs[Env.Mainnet],
  customLocalnetIp: null,
  setEnv: (newEnv: Env) => {
    set((state) =>
      produce(state, (draft: any) => {
        draft.env = newEnv;
      }),
    );
  },
  setCustomLocalnetIp: (ip = null) => {
    set((state) =>
      produce(state, (draft) => {
        draft.customLocalnetIp = ip;
        draft.config.
      }),
    );
  },
}));
