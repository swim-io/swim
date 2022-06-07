import { useMutation } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { selectInteractionStateById } from "../../core/selectors";
import { useInteractionState } from "../../core/store";
import { createSplTokenAccount } from "../../models";

export const usePrepareSplTokenAccountMutation = () => {
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const interactionStateStore = useInteractionState();

  return useMutation(async (interactionId: string) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    const solanaAddress = wallet.publicKey?.toBase58();
    if (!solanaAddress) {
      throw new Error("Missing Solana address");
    }
    const interactionState = selectInteractionStateById(
      interactionStateStore,
      interactionId,
    );
    const { interaction, requiredSplTokenAccounts } = interactionState;
    await Promise.all(
      Object.entries(requiredSplTokenAccounts).map(
        async ([mint, accountState]) => {
          // Account exist, skip creation step
          if (accountState.account !== null) {
            return;
          }
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
        },
      ),
    );
  });
};
