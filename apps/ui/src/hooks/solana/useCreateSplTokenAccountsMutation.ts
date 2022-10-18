import type { TokenAccount } from "@swim-io/solana";
import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";
import { findOrCreateSplTokenAccount } from "../../models";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";
import {
  getUserSolanaTokenAccountsQueryKey,
  useUserSolanaTokenAccountsQuery,
} from "./useUserSolanaTokenAccountsQuery";

export const useCreateSplTokenAccountsMutation = (): UseMutationResult<
  readonly TokenAccount[],
  Error,
  readonly string[]
> => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaClient = useSolanaClient();
  const { wallet, address } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useUserSolanaTokenAccountsQuery();

  return useMutation<readonly TokenAccount[], Error, readonly string[]>(
    async (mints: readonly string[]): Promise<readonly TokenAccount[]> => {
      if (wallet === null || address === null) {
        throw new Error("Missing Solana wallet");
      }
      if (splTokenAccounts === null) {
        throw new Error(
          "SPL token accounts not loaded, please try again later",
        );
      }
      const tokenAccountData = await Promise.all(
        mints.map(async (mint) =>
          findOrCreateSplTokenAccount({
            env,
            solanaClient,
            wallet,
            queryClient,
            splTokenMintAddress: mint,
            splTokenAccounts,
          }),
        ),
      );
      // refetch the token accounts by owner as there will be a new SPL token account
      await queryClient.invalidateQueries(
        getUserSolanaTokenAccountsQueryKey(env, address),
      );
      return tokenAccountData.map((data) => data.tokenAccount);
    },
  );
};
