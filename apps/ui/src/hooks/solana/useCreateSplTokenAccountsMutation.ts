<<<<<<< HEAD
import type { Env } from "@swim-io/core";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import { findTokenAccountForMint } from "@swim-io/solana";
import { sleep } from "@swim-io/utils";
import type { QueryClient, UseMutationResult } from "react-query";
=======
import type { TokenAccount } from "@swim-io/solana";
import type { UseMutationResult } from "react-query";
>>>>>>> 1c2f52a6 (chore(ui): Single chain solana swap)
import { useMutation, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";
import { findOrCreateSplTokenAccount } from "../../models";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";
import { useSplTokenAccountsQuery } from "./useSplTokenAccountsQuery";

<<<<<<< HEAD
const findOrCreateSplTokenAccount = async (
  env: Env,
  solanaClient: SolanaClient,
  wallet: SolanaWalletAdapter,
  queryClient: QueryClient,
  splTokenMintAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): Promise<TokenAccount> => {
  if (!wallet.publicKey) {
    throw new Error("Solana wallet not connected");
  }
  const existingAccount = findTokenAccountForMint(
    splTokenMintAddress,
    wallet.publicKey.toBase58(),
    splTokenAccounts,
  );
  if (existingAccount) {
    return existingAccount;
  }
  const solanaAddress = wallet.publicKey.toBase58();
  await solanaClient.createSplTokenAccount(wallet, splTokenMintAddress);
  await sleep(1000); // TODO: Find a better condition
  await queryClient.invalidateQueries([env, "tokenAccounts", solanaAddress]);
  return solanaClient.getTokenAccountWithRetry(
    splTokenMintAddress,
    solanaAddress,
  );
};

=======
>>>>>>> 1c2f52a6 (chore(ui): Single chain solana swap)
export const useCreateSplTokenAccountsMutation = (): UseMutationResult<
  readonly TokenAccount[],
  Error,
  readonly string[]
> => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaClient = useSolanaClient();
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
      const tokenAccountData = await Promise.all(
        mints.map(async (mint) =>
          findOrCreateSplTokenAccount(
            env,
            solanaClient,
            wallet,
            queryClient,
            mint,
            splTokenAccounts,
          ),
        ),
      );
      await queryClient.invalidateQueries([env, "tokenAccounts", address]);
      return tokenAccountData.map((data) => data.tokenAccount);
    },
  );
};
