import { Env } from "@swim-io/core";
import { SolanaClient } from "@swim-io/solana";
import type { ReactElement, ReactNode } from "react";
import { createContext, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../config";
import { selectConfig } from "../core/selectors";
import { useEnvironment } from "../core/store";

const SOLANA_MAINNET_RPC_URLS = process.env.SOLANA_MAINNET_RPC_URLS;

export const getSolanaEndpoints = (
  env: Env,
  publicRpcUrls: readonly string[],
): readonly string[] => {
  if (env === Env.Mainnet && SOLANA_MAINNET_RPC_URLS) {
    try {
      return SOLANA_MAINNET_RPC_URLS.split(" ").filter((url) => url);
    } catch {
      // Invalid env variable, fallback to default case.
    }
  }
  return publicRpcUrls;
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
  const endpoints = getSolanaEndpoints(env, chainConfig.publicRpcUrls);
  const client = useMemo(() => new SolanaClient(endpoints), [endpoints]);

  return (
    <SolanaClientContext.Provider value={client}>
      {children}
    </SolanaClientContext.Provider>
  );
};