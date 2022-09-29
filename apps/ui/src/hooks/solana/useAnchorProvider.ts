import { AnchorProvider } from "@project-serum/anchor";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";

export const useAnchorProvider = (): AnchorProvider | null => {
  const solanaClient = useSolanaClient().rawConnection;
  const { wallet } = useSolanaWallet();

  if (!wallet || !wallet.publicKey) {
    return null;
  }
  const anchorProvider = new AnchorProvider(
    solanaClient,
    {
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
      publicKey: wallet.publicKey,
    },
    AnchorProvider.defaultOptions(),
  );
  return anchorProvider;
};
