import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";

// Returns user's Solana balance in SOL.
export const useSolBalanceQuery = (): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: walletAddress } = useSolanaWallet();
  return useQuery<Decimal, Error>(
    ["solBalance", env, walletAddress],
    async () => {
      if (!walletAddress) {
        return new Decimal(0);
      }
      try {
        const balance = await solanaConnection.getBalance(
          new PublicKey(walletAddress),
        );
        // Convert lamports to SOL.
        return new Decimal(balance).dividedBy(1000000000);
      } catch {
        return new Decimal(0);
      }
    },
  );
};
