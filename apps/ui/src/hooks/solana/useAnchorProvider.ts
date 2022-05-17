const GetAnchorProvider = (connection, wallet) => {
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
