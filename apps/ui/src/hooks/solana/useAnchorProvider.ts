import { AnchorProvider } from "@project-serum/anchor";

import { useSolanaConnection, useSolanaWallet } from "../../contexts";

export const useAnchorProvider = (): AnchorProvider | null => {
  const solanaConnection = useSolanaConnection().rawConnection;
  const { wallet } = useSolanaWallet();

  if (!wallet || !wallet.publicKey) {
    return null;
  }
  const anchorProvider = new AnchorProvider(
    solanaConnection,
    {
      ...wallet,
      publicKey: wallet.publicKey,
    },
    AnchorProvider.defaultOptions(),
  );
  return anchorProvider;
};
