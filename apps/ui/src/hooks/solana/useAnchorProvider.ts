import { AnchorProvider } from "@project-serum/anchor";

import { useSolanaConnection } from "../../contexts";

import { useSolanaWallet } from "./useSolanaWallet";

export const useAnchorProvider = (): AnchorProvider | null => {
  const solanaConnection = useSolanaConnection().rawConnection;
  const { wallet } = useSolanaWallet();

  if (!wallet || !wallet.publicKey) {
    return null;
  }
  const anchorProvider = new AnchorProvider(
    solanaConnection,
    {
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
      publicKey: wallet.publicKey,
    },
    AnchorProvider.defaultOptions(),
  );
  return anchorProvider;
};
