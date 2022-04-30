import type { ReactElement, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

import type { Config } from "../config";
import { DEFAULT_ENV, Env, configs, overrideLocalnetIp } from "../config";
import { useLocalStorageState } from "../hooks/browser";
import type { ReadonlyRecord } from "../utils";

interface Environment {
  readonly env: Env;
  readonly setEnv: (newEnv: Env) => void;
  readonly envs: readonly Env[];
}

const noobEnvs = [Env.Mainnet];

const defaultEnvironment = {
  env: Env.Mainnet,
  setEnv: () => {},
  envs: noobEnvs,
};

const EnvironmentContext = createContext<Environment>(defaultEnvironment);

export const EnvironmentProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const [storedEnv, setEnv] = useLocalStorageState<Env>("env", DEFAULT_ENV);
  const [customLocalnetIp] = useLocalStorageState<string | null>(
    "customLocalnetIp",
    null,
  );
  const envs = customLocalnetIp === null ? noobEnvs : Object.values(Env);
  const env = envs.includes(storedEnv) ? storedEnv : DEFAULT_ENV;

  const config: Environment = {
    env,
    setEnv,
    envs,
  };
  return (
    <EnvironmentContext.Provider value={config}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = (): Environment => useContext(EnvironmentContext);

export const useConfig = (): Config => {
  const { env } = useEnvironment();
  const [customLocalnetIp] = useLocalStorageState<string | null>(
    "customLocalnetIp",
    null,
  );

  const configsWithCustom: ReadonlyRecord<Env, Config> = useMemo(
    () => ({
      ...configs,
      [Env.CustomLocalnet]:
        customLocalnetIp !== null
          ? overrideLocalnetIp(configs[Env.Localnet], customLocalnetIp)
          : configs[Env.Localnet],
    }),
    [customLocalnetIp],
  );

  return configsWithCustom[env];
};
