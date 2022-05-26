import { AnchorProvider, setProvider } from "@project-serum/anchor";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";

export const useAnchorProvider = (): AnchorProvider | null => {
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

  const anchorProvider = new AnchorProvider(
    solanaConnection,
    anchorWallet,
    AnchorProvider.defaultOptions(),
  );
  setProvider(anchorProvider);
  return anchorProvider;
};
