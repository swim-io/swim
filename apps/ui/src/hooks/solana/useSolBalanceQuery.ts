import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useSolBalanceQuery = (): UseQueryResult<Decimal, Error> => {
  const env = useEnvironment(selectEnv);
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
