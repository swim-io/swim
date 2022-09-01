import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import { useEnvironment } from "../../core/store";
import type { TokenAccount } from "../../models";
import {
  deserializeTokenAccount,
  getMultipleSolanaAccounts,
} from "../../models";

import { useSolanaConnection } from "./useSolanaConnection";

export const useSolanaLiquidityQuery = (
  tokenAccountAddresses: readonly string[],
): UseQueryResult<readonly (TokenAccount | null)[], Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();

  return useQuery<readonly (TokenAccount | null)[], Error>(
    ["liquidity", env, tokenAccountAddresses.join("")],
    async () => {
      if (tokenAccountAddresses.length === 0) {
        return [];
      }

      const { keys: foundAddresses, array: tokenAccounts } =
        await getMultipleSolanaAccounts(
          solanaConnection,
          tokenAccountAddresses,
        );

      return tokenAccounts.map((account, i) => {
        try {
          return deserializeTokenAccount(
            new PublicKey(foundAddresses[i]),
            account.data,
          );
        } catch (error) {
          return null;
        }
      });
    },
  );
};

export const useSolanaLiquidityQueries = (
  tokenAccountAddresses: readonly (readonly string[])[],
): readonly UseQueryResult<readonly TokenAccount[], Error>[] => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();

  return useQueries(
    tokenAccountAddresses.map((addresses) => ({
      queryKey: ["liquidity", env, addresses.join("")],
      queryFn: async (): Promise<readonly TokenAccount[]> => {
        if (addresses.length === 0) {
          return [];
        }

        const { keys: foundAddresses, array: tokenAccounts } =
          await getMultipleSolanaAccounts(solanaConnection, addresses);

        return tokenAccounts.map((account, i) =>
          deserializeTokenAccount(
            new PublicKey(foundAddresses[i]),
            account.data,
          ),
        );
      },
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<readonly TokenAccount[], Error>[];
};
