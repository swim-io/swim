import Decimal from "decimal.js";

import { findTokenAccountForMint } from "../../models";

import { useSolanaWallet } from "./useSolanaWallet";
import { useSplTokenAccountsQuery } from "./useSplTokenAccountsQuery";

export const useSplUserBalance = (
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
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery(
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
