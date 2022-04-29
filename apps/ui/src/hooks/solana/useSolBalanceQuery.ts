import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";

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
        return new Decimal(balance);
      } catch {
        return new Decimal(0);
      }
    },
  );
};
