import * as anchor from "@project-serum/anchor";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";

export const useAnchorProvider = (): anchor.AnchorProvider | null => {
  const solanaConnection = useSolanaConnection().rawConnection;
  const wallet = useSolanaWallet().wallet;

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  const anchorWallet = {
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    publicKey: wallet.publicKey,
  };

  const anchorProvider = new anchor.AnchorProvider(
    solanaConnection,
    anchorWallet,
    anchor.AnchorProvider.defaultOptions(),
  );
  anchor.setProvider(anchorProvider);
  return anchorProvider;
};
