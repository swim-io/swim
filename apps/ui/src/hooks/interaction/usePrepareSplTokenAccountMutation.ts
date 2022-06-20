import { useMutation, useQueryClient } from "react-query";

import { useSolanaWallet } from "..";
import { useSolanaConnection } from "../../contexts";
import { selectGetInteractionState } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { createSplTokenAccount } from "../../models";
import { getSplTokenAccountsQueryKey } from "../solana";

export const usePrepareSplTokenAccountMutation = () => {
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);
  const queryClient = useQueryClient();

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

    const missingAccountMints = Object.entries(requiredSplTokenAccounts)
      .filter(([_mint, accountState]) => accountState.account === null)
      .map(([mint, _accountState]) => mint);
    await Promise.all(
      missingAccountMints.map(async (mint) => {
        const creationTxId = await createSplTokenAccount(
          solanaConnection,
          wallet,
          mint,
        );
        await solanaConnection.confirmTx(creationTxId);
        const account = await solanaConnection.getTokenAccountWithRetry(
          mint,
          solanaAddress,
        );

        // Update interactionState
        updateInteractionState(interaction.id, (draft) => {
          draft.requiredSplTokenAccounts[mint].account = account;
          draft.requiredSplTokenAccounts[mint].txId = creationTxId;
        });
      }),
    );

    if (missingAccountMints.length > 0) {
      const splTokenAccountsQueryKey = getSplTokenAccountsQueryKey(
        interaction.env,
        solanaAddress,
      );
      await queryClient.refetchQueries(splTokenAccountsQueryKey);
    }
  });
};
