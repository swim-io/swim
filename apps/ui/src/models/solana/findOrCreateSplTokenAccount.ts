import type { Env } from "@swim-io/core";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import { findTokenAccountForMint } from "@swim-io/solana";
import { sleep } from "@swim-io/utils";
import type { QueryClient } from "react-query";

export const findOrCreateSplTokenAccount = async ({
  env,
  solanaClient,
  wallet,
  queryClient,
  splTokenMintAddress,
  splTokenAccounts,
}: {
  readonly env: Env;
  readonly solanaClient: SolanaClient;
  readonly wallet: SolanaWalletAdapter;
  readonly queryClient: QueryClient;
  readonly splTokenMintAddress: string;
  readonly splTokenAccounts: readonly TokenAccount[];
}): Promise<{
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
  await queryClient.invalidateQueries([
    env,
    "userSolanaTokenAccounts",
    solanaAddress,
  ]);
  const tokenAccount = await solanaClient.getTokenAccountWithRetry(
    splTokenMintAddress,
    solanaAddress,
  );
  return {
    tokenAccount,
    creationTxId: createSplTokenAccountTxId,
  };
};
