import type { Account as TokenAccount } from "@solana/spl-token";
import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";
import { findOrCreateSplTokenAccount } from "../../models";

import { useSolanaConnection } from "./useSolanaConnection";
import { useSolanaWallet } from "./useSolanaWallet";
import { useSplTokenAccountsQuery } from "./useSplTokenAccountsQuery";

export const useCreateSplTokenAccountsMutation = (): UseMutationResult<
  readonly TokenAccount[],
  Error,
  readonly string[]
> => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaConnection = useSolanaConnection();
  const { wallet, address } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

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
