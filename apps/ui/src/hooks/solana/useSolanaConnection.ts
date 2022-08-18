import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { SolanaConnection } from "../../models";

export const useSolanaConnection = (): SolanaConnection => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chain] = chains[Protocol.Solana];
  const { endpoints } = chain;

  const queryClient = useQueryClient();
  const queryKey = [env, "solanaConnection"];

  const connection =
    // used as context cache to avoid multiple instances
    queryClient.getQueryData<SolanaConnection>(queryKey) ||
    (function createSolanaConnection(): SolanaConnection {
      const solanaConnection = new SolanaConnection(endpoints);
      queryClient.setQueryData(queryKey, solanaConnection);
      return solanaConnection;
    })();

  return connection;
};
