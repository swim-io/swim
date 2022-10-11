import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaAccountChangeListener } from "./useSolanaConnectionListener";
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
  useSolanaAccountChangeListener(
    [{ key: walletAddress, enabled: options?.enabled }],
    (key, accountInfo) => {
      queryClient.setQueryData(
        [env, "solBalance", key],
        lamportsToSol(accountInfo.lamports),
      );
    },
  );

  return useQuery<Decimal, Error>(
    [env, "solBalance", walletAddress],
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
