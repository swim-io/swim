import type { TokenAccount } from "@swim-io/solana";
import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";

export const useSolanaLiquidityQuery = (
  tokenAccountAddresses: readonly string[],
): UseQueryResult<readonly (TokenAccount | null)[], Error> => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();

  return useQuery<readonly (TokenAccount | null)[], Error>(
    [env, "liquidity", tokenAccountAddresses.join("")],
    async () => {
      if (tokenAccountAddresses.length === 0) {
        return [];
      }

      return await solanaClient.getMultipleTokenAccounts(tokenAccountAddresses);
    },
  );
};

export const useSolanaLiquidityQueries = (
  tokenAccountAddresses: readonly (readonly string[])[],
): readonly UseQueryResult<readonly (TokenAccount | null)[], Error>[] => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();

  return useQueries(
    tokenAccountAddresses.map((addresses) => ({
      queryKey: [env, "liquidity", addresses.join("")],
      queryFn: async (): Promise<readonly (TokenAccount | null)[]> => {
        if (addresses.length === 0) {
          return [];
        }

        return await solanaClient.getMultipleTokenAccounts(addresses);
      },
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<readonly (TokenAccount | null)[], Error>[];
};
