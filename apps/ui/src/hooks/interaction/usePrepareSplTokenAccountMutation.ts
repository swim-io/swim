import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import { findOrCreateSplTokenAccount } from "../../models";
import { useSplTokenAccountsQuery } from "../solana";

export const useCreateSplTokenAccountMutation = (): UseMutationResult<
  TokenAccount,
  Error,
  string
> => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  return useMutation(async (mint: string) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    if (splTokenAccounts === null) {
      throw new Error("SPL token accounts not loaded, please try again later");
    }
    return await findOrCreateSplTokenAccount(
      env,
      solanaConnection,
      wallet,
      queryClient,
      mint,
      splTokenAccounts,
    );
  });
};
