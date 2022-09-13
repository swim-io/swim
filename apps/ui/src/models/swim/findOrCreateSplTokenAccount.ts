import type { Env } from "@swim-io/core";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import { findTokenAccountForMint } from "@swim-io/solana";
import { sleep } from "@swim-io/utils";
import type { QueryClient } from "react-query";

export const findOrCreateSplTokenAccount = async (
  env: Env,
  solanaClient: SolanaClient,
  wallet: SolanaWalletAdapter,
  queryClient: QueryClient,
  splTokenMintAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): Promise<{
  readonly tokenAccount: TokenAccount;
  readonly creationTxId: string | null;
}> => {
  if (!wallet.publicKey) {
    throw new Error("Solana wallet not connected");
  }
  const existingAccount = findTokenAccountForMint(
    splTokenMintAddress,
    wallet.publicKey.toBase58(),
    splTokenAccounts,
  );
  if (existingAccount) {
    return {
      tokenAccount: existingAccount,
      creationTxId: null,
    };
  }
  const solanaAddress = wallet.publicKey.toBase58();
  const createSplTokenAccountTxId = await solanaClient.createSplTokenAccount(
    wallet,
    splTokenMintAddress,
  );
  await solanaClient.confirmTx(createSplTokenAccountTxId);
  await sleep(1000); // TODO: Find a better condition
  await queryClient.invalidateQueries(["tokenAccounts", env, solanaAddress]);
  const tokenAccount = await solanaClient.getTokenAccountWithRetry(
    splTokenMintAddress,
    solanaAddress,
  );
  return {
    tokenAccount,
    creationTxId: createSplTokenAccountTxId,
  };
};
