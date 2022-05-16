import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";
import { findOrCreateSplTokenAccount } from "../../models";

import { useSplTokenAccountsQuery } from "./useSplTokenAccountsQuery";

export const useCreateSplTokenAccountsMutation = (): UseMutationResult<
  readonly TokenAccountInfo[],
  Error,
  readonly string[]
> => {
  const env = useEnvironmentStore(selectEnv);
  const queryClient = useQueryClient();
  const solanaConnection = useSolanaConnection();
  const { wallet, address } = useSolanaWallet();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();

  return useMutation<readonly TokenAccountInfo[], Error, readonly string[]>(
    async (mints: readonly string[]): Promise<readonly TokenAccountInfo[]> => {
      if (wallet === null || address === null) {
        throw new Error("Missing Solana wallet");
      }
      const tokenAccounts = await Promise.all(
        mints.map(async (mint) =>
          findOrCreateSplTokenAccount(
            env,
            solanaConnection,
            wallet,
            queryClient,
            mint,
            splTokenAccounts,
          ),
        ),
      );
      await queryClient.invalidateQueries(["tokenAccounts", env, address]);
      return tokenAccounts;
    },
  );
};
