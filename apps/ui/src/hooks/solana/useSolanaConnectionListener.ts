import type { AccountChangeCallback } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useRef } from "react";
import { useDeepCompareMemo } from "use-deep-compare";

import { useSolanaClient } from "./useSolanaClient";

type SubscriptionKey = string | null | undefined;
export type SolanaAccountChangeListenerCallback = (
  key: NonNullable<SubscriptionKey>,
  ...args: Parameters<AccountChangeCallback>
) => ReturnType<AccountChangeCallback>;

// This hook does not use context to avoid registering multiple listeners on same public key because `@solana/web3.js` will aggregate multiple requests with same public key into one single call: https://github.com/solana-labs/solana-web3.js/blob/7004e1550481614fea35182fda61659b284462d9/src/connection.ts#L5252-L5262
export const useSolanaAccountChangeListener = (
  queryOptions: readonly {
    /** Must be literal so the reference is the same across different renders, and thus less unnecessary re-renders */
    readonly key: SubscriptionKey;
    /** Enable this listener or not. default: true */
    readonly enabled?: boolean | undefined;
  }[],
  /** No need to pass a static reference because we will reference this function in a static function */
  callback: (
    key: NonNullable<SubscriptionKey>,
    ...args: Parameters<AccountChangeCallback>
  ) => ReturnType<AccountChangeCallback>,
) => {
  // directly save the reference of `connection` field otherwise it may refers to latest `connection` after we rotate the connection and thus cannot remove listeners in old connection
  const { connection: solanaConnection } = useSolanaClient();

  // To make sure the reference is static if the array items are the same, to avoid unnecessary re-renders
  const staticKeys = useDeepCompareMemo(() => {
    return queryOptions
      .filter((queryOption) => queryOption.enabled ?? true)
      .map((queryOption) => queryOption.key)
      .filter(<T>(key: T): key is NonNullable<T> => Boolean(key));
  }, [queryOptions]);

  const callbackRef = useRef(callback);
  // eslint-disable-next-line functional/immutable-data
  callbackRef.current = callback;

  useEffect(() => {
    const clientSubscriptionIds = staticKeys.map((key) => {
      return solanaConnection.onAccountChange(new PublicKey(key), (...args) => {
        return callbackRef.current(key, ...args);
      });
    });

    return () => {
      for (const clientSubscriptionId of clientSubscriptionIds) {
        solanaConnection
          .removeAccountChangeListener(clientSubscriptionId)
          .catch(console.error);
      }
    };
  }, [callbackRef, solanaConnection, staticKeys]);
};
