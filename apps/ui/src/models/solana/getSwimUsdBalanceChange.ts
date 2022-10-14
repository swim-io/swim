import type { SolanaClient, TokenAccount } from "@swim-io/solana";
import Decimal from "decimal.js";

export const getSwimUsdBalanceChange = async (
  swapToSwimUsdTxId: string,
  solanaClient: SolanaClient,
  swimUsdSplTokenAccount: TokenAccount,
): Promise<Decimal> => {
  const tx = await solanaClient.getParsedTx(swapToSwimUsdTxId);
  if (tx.meta === null) {
    throw new Error("Missing parsed transaction");
  }
  const { preTokenBalances, postTokenBalances } = tx.meta;
  if (!preTokenBalances || !postTokenBalances) {
    throw new Error("Missing parsed transaction");
  }
  const mint = swimUsdSplTokenAccount.mint.toBase58();
  const owner = swimUsdSplTokenAccount.owner.toBase58();
  const preSwimUsdBalance = preTokenBalances.find(
    (balance) => balance.mint === mint && balance.owner === owner,
  );
  const postSwimUsdBalance = postTokenBalances.find(
    (balance) => balance.mint === mint && balance.owner === owner,
  );
  if (
    !preSwimUsdBalance ||
    preSwimUsdBalance.uiTokenAmount.uiAmount === null ||
    !postSwimUsdBalance ||
    postSwimUsdBalance.uiTokenAmount.uiAmount === null
  ) {
    throw new Error("Missing swimUsd balance");
  }
  return new Decimal(postSwimUsdBalance.uiTokenAmount.uiAmount).sub(
    new Decimal(preSwimUsdBalance.uiTokenAmount.uiAmount),
  );
};
