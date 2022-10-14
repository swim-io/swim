import { findTokenAccountForMint } from "@swim-io/solana";
import Decimal from "decimal.js";

import { useSolanaWallet } from "./useSolanaWallet";
import { useUserSolanaTokenAccountsQuery } from "./useUserSolanaTokenAccountsQuery";

export const useUserSolanaTokenBalance = (
  mintAddress: string | null,
  {
    enabled = true,
  }: {
    /** Set this to `false` to disable automatic fetching when mounts
     * @defaultValue true
     */
    readonly enabled?: boolean;
  } = {},
): Decimal | null => {
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useUserSolanaTokenAccountsQuery(
    undefined,
    { enabled },
  );
  const splTokenAccount =
    mintAddress !== null && walletAddress !== null && splTokenAccounts !== null
      ? findTokenAccountForMint(mintAddress, walletAddress, splTokenAccounts)
      : null;
  return splTokenAccount
    ? new Decimal(splTokenAccount.amount.toString())
    : null;
};
