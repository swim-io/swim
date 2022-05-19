import { getSolanaTokenDetails } from "../../config";
import { useSplTokenAccountsQuery } from "../solana";

import type { PrepareSplTokenAccountsState } from "./useInteractionState";
import { useRequiredTokensForInteraction } from "./useRequiredTokensForInteraction";

export const usePrepareSplTokenAccountsState = (
  interactionId: string,
): PrepareSplTokenAccountsState => {
  const requiredTokens = useRequiredTokensForInteraction(interactionId);
  const mints = requiredTokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const { data: tokenAccounts } = useSplTokenAccountsQuery();
  const tokenAccountState = mints.reduce(
    (state, mint) => ({
      ...state,
      [mint]: tokenAccounts?.find(
        (account) => account.mint.toBase58() === mint,
      ),
    }),
    {},
  );
  return { tokenAccountState };
};
