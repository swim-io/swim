import { Keypair } from "@solana/web3.js";
import { useEffect, useMemo } from "react";
import shallow from "zustand/shallow.js";

import { Protocol } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { SolanaConnection } from "../../models";

export const useSolanaConnection = (): SolanaConnection => {
  const { chains } = useEnvironment(selectConfig, shallow);
  const [chain] = chains[Protocol.Solana];
  const { endpoints, wsEndpoints } = chain;

  const connection = useMemo(
    () => new SolanaConnection(endpoints, wsEndpoints),
    [endpoints, wsEndpoints],
  );

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
