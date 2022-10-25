import type { TokenDetails } from "@swim-io/core";
import { findTokenAccountForMint } from "@swim-io/solana";
import { atomicToHuman } from "@swim-io/utils";
import Decimal from "decimal.js";

import { useSolanaWallet } from "./useSolanaWallet";
import { useUserSolanaTokenAccountsQuery } from "./useUserSolanaTokenAccountsQuery";

export const useUserSolanaTokenBalance = (
  tokenDetails: TokenDetails | null,
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
  if (tokenDetails === null) {
    return null;
  }
  const splTokenAccount =
    walletAddress !== null && splTokenAccounts !== null
      ? findTokenAccountForMint(
          tokenDetails.address,
          walletAddress,
          splTokenAccounts,
        )
      : null;
  return splTokenAccount
    ? atomicToHuman(
        new Decimal(splTokenAccount.amount.toString()),
        tokenDetails.decimals,
      )
    : null;
};
