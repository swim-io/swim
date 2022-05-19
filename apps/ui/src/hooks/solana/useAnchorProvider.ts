import { useSolanaConnection, useSolanaWallet } from "../../contexts";

const GetAnchorProvider = () => {
  const solanaConnection = useSolanaConnection();
  const wallet = useSolanaWallet().wallet;
  const anchorWallet = {
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    publicKey: wallet.publicKey,
  };

  return new anchor.AnchorProvider(
    connection,
    anchorWallet,
    anchor.AnchorProvider.defaultOptions(),
  );
}
