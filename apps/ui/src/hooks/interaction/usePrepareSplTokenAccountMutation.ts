import { useMutation } from "react-query";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { useInteractionStateStore } from "../../core/store/useInteractionStateStore";
import type { InteractionState } from "../../models";
import { createSplTokenAccount } from "../../models";
import { sleep } from "../../utils";

export const usePrepareSplTokenAccountMutation = () => {
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { updateInteractionState } = useInteractionStateStore();

  return useMutation(async (interactionState: InteractionState) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    const solanaAddress = wallet.publicKey?.toBase58();
    if (!solanaAddress) {
      throw new Error("Missing Solana address");
    }
    const { requiredSplTokenAccounts } = interactionState;
    for (const mint in requiredSplTokenAccounts) {
      const accountState = requiredSplTokenAccounts[mint];
      // if (!accountState) {
      //   throw new Error("Account state not exist");
      // }
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
      await sleep(1000); // TODO: Find a better condition
      const account = await solanaConnection.getTokenAccountWithRetry(
        mint,
        solanaAddress,
      );

      // TODO: [refactor] update state with txId and account
      console.log({ account, creationTxId });
      const { interaction } = interactionState;
      updateInteractionState(interaction.id, (draft) => {
        // eslint-disable-next-line functional/immutable-data
        draft.requiredSplTokenAccounts[mint].account = account;
        // eslint-disable-next-line functional/immutable-data
        draft.requiredSplTokenAccounts[mint].txId = creationTxId;
      });
    }
  });
};
