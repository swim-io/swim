import { Env } from "@swim-io/core";
import { SolanaClient } from "@swim-io/solana";
import type { ReactElement, ReactNode } from "react";
import { createContext, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

const SOLANA_MAINNET_RPC_URLS = process.env.REACT_APP_SOLANA_MAINNET_RPC_URLS;

export const getSolanaEndpoints = (env: Env): readonly string[] | undefined => {
  if (env === Env.Mainnet && SOLANA_MAINNET_RPC_URLS) {
    try {
      return SOLANA_MAINNET_RPC_URLS.split(" ").filter((url) => url);
    } catch {
      // Invalid env variable, fallback to default case.
    }
  }
  return undefined;
};

export const SolanaClientContext: React.Context<null | SolanaClient> =
  createContext<SolanaClient | null>(null);

export const SolanaClientProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chainConfig] = chains[Protocol.Solana];
  const endpoints = useMemo(() => getSolanaEndpoints(env), [env]);
  const client = useMemo(
    () => new SolanaClient(chainConfig, { endpoints }),
    [chainConfig, endpoints],
  );

  return (
    <SolanaClientContext.Provider value={client}>
      {children}
    </SolanaClientContext.Provider>
  );
};
