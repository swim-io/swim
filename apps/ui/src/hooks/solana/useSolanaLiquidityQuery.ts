import { PublicKey } from "@solana/web3.js";
import type { TokenAccount } from "@swim-io/solana";
import { deserializeTokenAccount } from "@swim-io/solana";
import type { UseQueryResult } from "react-query";
import { useQueries, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaAccountChangeListener } from "./useSolanaConnectionListener";

type ResultData = readonly (TokenAccount | null)[];

export const useSolanaLiquidityQueries = (
  tokenAccountAddresses: readonly (readonly string[])[],
): readonly UseQueryResult<ResultData, Error>[] => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaClient = useSolanaClient();

  useSolanaAccountChangeListener(
    tokenAccountAddresses.flat().map((address) => ({ key: address })),
    (updatedAddress, accountInfo) => {
      for (const addresses of tokenAccountAddresses) {
        if (!addresses.includes(updatedAddress)) continue;

        queryClient.setQueryData<ResultData>(
          [env, "liquidity", addresses.join()],
          (prevQueryData) => {
            if (!prevQueryData) return [];

            const newTokenAccount = deserializeTokenAccount(
              new PublicKey(updatedAddress),
              accountInfo.data,
            );

            return prevQueryData.map((prevTokenAccount) => {
              if (prevTokenAccount?.address.toString() === updatedAddress) {
                return newTokenAccount;
              }
              return prevTokenAccount;
            });
          },
        );
      }
    },
  );

  return useQueries(
    tokenAccountAddresses.map((addresses) => ({
      queryKey: [env, "liquidity", addresses.join()],
      queryFn: async (): Promise<ResultData> => {
        if (addresses.length === 0) {
          return [];
        }

        return await solanaClient.getMultipleTokenAccounts(addresses);
      },
      // rely on websocket to update outdated data
      staleTime: Infinity,
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<ResultData, Error>[];
};
