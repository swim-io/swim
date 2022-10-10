import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { useEffect, useMemo } from "react";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";

const lamportsToSol = (balance: Decimal.Value): Decimal => {
  return new Decimal(balance).dividedBy(LAMPORTS_PER_SOL);
};

// Returns user's Solana balance in SOL.
export const useSolBalanceQuery = (
  options?: Omit<UseQueryOptions<Decimal, Error>, "staleTime">,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();
  const { address: walletAddress } = useSolanaWallet();

  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => [env, "solBalance", walletAddress],
    [env, walletAddress],
  );

  useEffect(() => {
    if (!walletAddress || !options?.enabled) {
      return;
    }

    // Make sure all network requests are ignored after exit, so the state is not mixed, e.g. state between different wallet addresses
    let isExited = false;

    const clientSubscriptionId = solanaClient.connection.onAccountChange(
      new PublicKey(walletAddress),
      (accountInfo) => {
        if (isExited) return;

        queryClient.setQueryData(queryKey, lamportsToSol(accountInfo.lamports));
      },
    );
    return () => {
      isExited = true;

      solanaClient.connection
        .removeAccountChangeListener(clientSubscriptionId)
        .catch(console.error);
    };
  }, [
    options?.enabled,
    queryClient,
    queryKey,
    // make sure we are depending on `solanaClient.connection` not `solanaClient` because the reference of `solanaClient` won't change when we rotate the connection
    solanaClient.connection,
    walletAddress,
  ]);

  return useQuery<Decimal, Error>(
    queryKey,
    async () => {
      if (!walletAddress) {
        return new Decimal(0);
      }
      try {
        const balance = await solanaClient.connection.getBalance(
          new PublicKey(walletAddress),
        );
        return lamportsToSol(balance);
      } catch {
        return new Decimal(0);
      }
    },
    {
      ...options,
      // rely on websocket to update outdated data
      staleTime: Infinity,
    },
  );
};
