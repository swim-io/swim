import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQueries, useQuery } from "react-query";

import { useSolanaConnection } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";
import {
  deserializeTokenAccount,
  getMultipleSolanaAccounts,
} from "../../models";

export const useLiquidityQuery = (
  tokenAccountAddresses: readonly string[],
): UseQueryResult<readonly TokenAccount[], Error> => {
  const env = useEnvironmentStore(selectEnv);
  const solanaConnection = useSolanaConnection();

  return useQuery<readonly TokenAccount[], Error>(
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

      return tokenAccounts.map((account, i) =>
        deserializeTokenAccount(new PublicKey(foundAddresses[i]), account.data),
      );
    },
  );
};

export const useLiquidityQueries = (
  tokenAccountAddresses: readonly (readonly string[])[],
): readonly UseQueryResult<readonly TokenAccount[], Error>[] => {
  const env = useEnvironmentStore(selectEnv);
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
