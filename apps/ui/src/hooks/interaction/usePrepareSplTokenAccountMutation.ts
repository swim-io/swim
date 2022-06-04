import { useMutation } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { useInteractionState } from "../../core/store";
import { createSplTokenAccount } from "../../models";

export const usePrepareSplTokenAccountMutation = () => {
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { updateInteractionState, getInteractionState } = useInteractionState();

  return useMutation(async (interactionId: string) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    const solanaAddress = wallet.publicKey?.toBase58();
    if (!solanaAddress) {
      throw new Error("Missing Solana address");
    }
    const interactionState = getInteractionState(interactionId);
    const { interaction, requiredSplTokenAccounts } = interactionState;
    for (const mint in requiredSplTokenAccounts) {
      const accountState = requiredSplTokenAccounts[mint];
      // Account exist, skip creation step
      if (accountState.account !== null) {
        continue;
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
    }
  });
};
