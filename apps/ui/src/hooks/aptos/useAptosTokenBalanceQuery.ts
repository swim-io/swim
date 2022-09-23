import type Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

import { useAptosClient } from "./useAptosClient";
import { useAptosWallet } from "./useAptosWallet";

export const useAptosTokenBalanceQuery = (
  contractAddress: string | null,
  options?: UseQueryOptions<Decimal | null, Error>,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const aptosClient = useAptosClient();
  const { address: walletAddress } = useAptosWallet();

  return useQuery<Decimal | null, Error>(
    [env, "aptosTokenBalance", contractAddress, walletAddress],
    async (): Promise<Decimal | null> => {
      if (walletAddress === null || contractAddress === null) {
        return null;
      }
      return aptosClient.getTokenBalance(walletAddress, contractAddress);
    },
    options,
  );
};
