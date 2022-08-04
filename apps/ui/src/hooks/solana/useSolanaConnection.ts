import { Keypair } from "@solana/web3.js";
import { useEffect } from "react";
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
  const { endpoints, wsEndpoints } = chain;

<<<<<<< HEAD
  const connection = useMemo(
    () => new SolanaConnection(endpoints, wsEndpoints),
    [endpoints, wsEndpoints],
  );
=======
  const queryClient = useQueryClient();
  const queryKey = [env, "solanaConnection"];

  const connection =
    // used as context cache to avoid multiple instances
    queryClient.getQueryData<SolanaConnection>(queryKey) ||
    (function createSolanaConnection(): SolanaConnection {
      const solanaConnection = new SolanaConnection(endpoint, wsEndpoint);
      queryClient.setQueryData(queryKey, solanaConnection);
      return solanaConnection;
    })();
>>>>>>> 1c2e272c0c4dd07665990e32e0a921de922e5b22

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from ever getting empty
  useEffect(() => {
    const subscriptionId = connection.onAccountChange(
      Keypair.generate().publicKey,
      () => {},
    );
    return () => {
      connection
        .removeAccountChangeListener(subscriptionId)
        .catch(console.error);
    };
  }, [connection]);

  return connection;
};
