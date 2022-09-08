import type { Env } from "@swim-io/core";
import type {
  SolanaConnection,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import { findTokenAccountForMint } from "@swim-io/solana";
import { sleep } from "@swim-io/utils";
import type { QueryClient } from "react-query";

export const findOrCreateSplTokenAccount = async (
  env: Env,
  solanaConnection: SolanaConnection,
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
  const createSplTokenAccountTxId =
    await solanaConnection.createSplTokenAccount(wallet, splTokenMintAddress);
  await solanaConnection.confirmTx(createSplTokenAccountTxId);
  await sleep(1000); // TODO: Find a better condition
  await queryClient.invalidateQueries(["tokenAccounts", env, solanaAddress]);
  return solanaConnection.getTokenAccountWithRetry(
    splTokenMintAddress,
    solanaAddress,
  );
};
