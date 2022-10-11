import type { TokenDetails } from "@swim-io/core";
import { findTokenAccountForMint } from "@swim-io/solana";
import { atomicToHuman } from "@swim-io/utils";
import Decimal from "decimal.js";

import { useSolanaWallet } from "./useSolanaWallet";
import { useSplTokenAccountsQuery } from "./useSplTokenAccountsQuery";

export const useSplUserBalance = (
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
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery(
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
