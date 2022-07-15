import { Keypair } from "@solana/web3.js";
import { useEffect } from "react";
import { useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";
import { SolanaConnection } from "../../models";
import { useSolanaEcosystem } from "../crossEcosystem/useEcosystems";

export const useSolanaConnection = (): SolanaConnection => {
  const { env } = useEnvironment();
  const solanaChain = useSolanaEcosystem().chain;
  const { endpoint, wsEndpoint } = solanaChain;

  const queryClient = useQueryClient();
  const queryKey = [env, "solanaConnection"];

  const connection =
    queryClient.getQueryData<SolanaConnection>(queryKey) ||
    (function createSolanaConnection(): SolanaConnection {
      const solanaConnection = new SolanaConnection(endpoint, wsEndpoint);
      queryClient.setQueryData(queryKey, solanaConnection);
      return solanaConnection;
    })();

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
