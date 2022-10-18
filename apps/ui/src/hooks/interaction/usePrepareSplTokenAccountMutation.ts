import { findTokenAccountForMint } from "@swim-io/solana";
import { useMutation, useQueryClient } from "react-query";

import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import {
  getUserSolanaTokenAccountsQueryKey,
  useSolanaClient,
  useSolanaWallet,
  useUserSolanaTokenAccountsQuery,
} from "../solana";

export const usePrepareSplTokenAccountMutation = () => {
  const solanaClient = useSolanaClient();
  const { wallet } = useSolanaWallet();
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);
  const queryClient = useQueryClient();
  const { data: splTokenAccounts = [] } = useUserSolanaTokenAccountsQuery();

  return useMutation(async (interactionId: string) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    const solanaAddress = wallet.publicKey?.toBase58();
    if (!solanaAddress) {
      throw new Error("Missing Solana address");
    }
    const { interaction, requiredSplTokenAccounts } =
      getInteractionState(interactionId);

    const missingAccountMints = Object.keys(requiredSplTokenAccounts).filter(
      (mint) => {
        const accountForMint = findTokenAccountForMint(
          mint,
          solanaAddress,
          splTokenAccounts,
        );
        return accountForMint === null;
      },
    );
    await Promise.all(
      missingAccountMints.map(async (mint) => {
        const creationTxId = await solanaClient.createSplTokenAccount(
          wallet,
          mint,
        );
        await solanaClient.confirmTx(creationTxId);
        // Update interactionState
        updateInteractionState(interaction.id, (draft) => {
          draft.requiredSplTokenAccounts[mint].txId = creationTxId;
        });
      }),
    );

    if (missingAccountMints.length > 0) {
      const splTokenAccountsQueryKey = getUserSolanaTokenAccountsQueryKey(
        interaction.env,
        solanaAddress,
      );
      // refetch the token accounts by owner as there will be a new SPL token account
      await queryClient.refetchQueries(splTokenAccountsQueryKey);
    }
  });
};
