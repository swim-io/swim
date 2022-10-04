import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";

// Returns user's Solana balance in SOL.
export const useSolBalanceQuery = (
  options?: UseQueryOptions<Decimal, Error>,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();
  const { address: walletAddress } = useSolanaWallet();
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
        // Convert lamports to SOL.
        return new Decimal(balance).dividedBy(LAMPORTS_PER_SOL);
      } catch {
        return new Decimal(0);
      }
    },
    options,
  );
};
