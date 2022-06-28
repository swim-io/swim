import { Keypair } from "@solana/web3.js";
import { useEffect } from "react";
import { useQuery } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { SolanaConnection } from "../../models";

export const useSolanaConnection = (): SolanaConnection => {
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chain] = chains[Protocol.Solana];
  const { endpoint, wsEndpoint } = chain;

  const createConnection = () => new SolanaConnection(endpoint, wsEndpoint);

  const query = useQuery(["solanaConnection", env], createConnection, {
    initialData: createConnection,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const connection = query.data as SolanaConnection;

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
