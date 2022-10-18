import type { TokenDetails } from "@swim-io/core";
import type Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

import { useAptosClient } from "./useAptosClient";
import { useAptosWallet } from "./useAptosWallet";

export const useAptosTokenBalanceQuery = (
  tokenDetails: TokenDetails | null,
  options?: UseQueryOptions<Decimal | null, Error>,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const aptosClient = useAptosClient();
  const { address: walletAddress } = useAptosWallet();

  return useQuery<Decimal | null, Error>(
    [env, "aptosTokenBalance", tokenDetails?.address, walletAddress],
    async (): Promise<Decimal | null> => {
      if (walletAddress === null || tokenDetails === null) {
        return null;
      }
      return aptosClient.getTokenBalance(walletAddress, tokenDetails);
    },
    options,
  );
};
