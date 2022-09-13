import type { BN, Program, SplToken, Wallet } from "@project-serum/anchor";
import { Spl, web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, findTokenAccountForMint } from "@swim-io/solana";
import { TwoPoolContext } from "@swim-io/solana-contracts";

import type { SolanaPoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";

import { SwimDefiInstruction } from "./instructions";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";
import { getSolanaPoolState } from "./pool";

const getApproveAndRevokeIxs = async (
  splToken: Program<SplToken>,
  tokenAccounts: ReadonlyArray<web3.PublicKey>,
  amounts: ReadonlyArray<BN>,
  delegate: web3.PublicKey,
  authority: web3.PublicKey,
) => {
  const approveIxs = await Promise.all(
    tokenAccounts.map((tokenAccount, i) => {
      return splToken.methods
        .approve(amounts[i])
        .accounts({
          source: tokenAccount,
          delegate,
          authority,
        })
        .instruction();
    }),
  );
  const revokeIxs = await Promise.all(
    tokenAccounts.map((tokenAccount) => {
      return splToken.methods
        .revoke()
        .accounts({
          source: tokenAccount,
          authority,
        })
        .instruction();
    }),
  );
  return [approveIxs, revokeIxs];
};

export const doSingleSolanaPoolOperationV2 = async (
  solanaClient: SolanaClient,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpec: SolanaPoolSpec,
  operation: OperationSpec,
): Promise<string> => {
  if (poolSpec.isLegacyPool) {
    throw new Error("Invalid pool version");
  }
  const walletPublicKey = wallet.publicKey;
  if (walletPublicKey === null) {
    throw new Error("Invalid wallet");
  }
  const walletAddress = walletPublicKey.toBase58();
  const poolState = await getSolanaPoolState(solanaClient, poolSpec);
  if (poolState === null) {
    throw new Error("Missing pool state");
  }
  const poolTokens = tokensByPoolId[poolSpec.id];
  const lpTokenMintAddress = getSolanaTokenDetails(poolTokens.lpToken).address;
  const userLpAccount = findTokenAccountForMint(
    lpTokenMintAddress,
    walletAddress,
    splTokenAccounts,
  );
  const tokenMintAddresses = poolTokens.tokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const userTokenAccounts = tokenMintAddresses.map((mint) =>
    findTokenAccountForMint(mint, walletAddress, splTokenAccounts),
  );

  const twoPool = TwoPoolContext.from(
    solanaClient.rawConnection,
    wallet as unknown as Wallet,
    new PublicKey(poolSpec.contract),
  );
  const splToken = Spl.token(twoPool.provider);
  const userTransferAuthority = web3.Keypair.generate();
  const userTokenAccount0 = userTokenAccounts[0]?.address ?? null;
  const userTokenAccount1 = userTokenAccounts[1]?.address ?? null;
  if (userTokenAccount0 === null || userTokenAccount1 === null) {
    throw new Error("Invalid user token account");
  }
  const accountsObject = {
    poolTokenAccount0: poolState.tokenKeys[0],
    poolTokenAccount1: poolState.tokenKeys[1],
    lpMint: poolState.lpMintKey,
    governanceFee: poolState.governanceFeeKey,
    userTransferAuthority: userTransferAuthority.publicKey,
    userTokenAccount0: userTokenAccount0,
    userTokenAccount1: userTokenAccount1,
    tokenProgram: splToken.programId,
  };
  const { instruction, params } = operation;
  switch (instruction) {
    case SwimDefiInstruction.Add: {
      if (userLpAccount === null) {
        throw new Error("Invalid user token account");
      }
      const inputAmounts = params.inputAmounts.map((amount) =>
        amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      );
      const minimumMintAmount =
        params.minimumMintAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userTokenAccount0, userTokenAccount1],
        inputAmounts,
        userTransferAuthority.publicKey,
        walletPublicKey,
      );
      const txToSign = await twoPool.program.methods
        .add(inputAmounts, minimumMintAmount)
        .accounts({
          ...accountsObject,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = walletPublicKey;
      return await solanaClient.sendAndConfirmTx((tx) => {
        tx.partialSign(userTransferAuthority);
        return wallet.signTransaction(tx);
      }, txToSign);
    }
    case SwimDefiInstruction.Swap: {
      const inputAmounts = params.exactInputAmounts.map((amount) =>
        amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      );
      const minimumOutputAmount =
        params.minimumOutputAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const outputTokenIndex = params.outputTokenIndex;
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userTokenAccount0, userTokenAccount1],
        inputAmounts,
        userTransferAuthority.publicKey,
        walletPublicKey,
      );
      const txToSign = await twoPool.program.methods
        .swapExactInput(inputAmounts, outputTokenIndex, minimumOutputAmount)
        .accounts(accountsObject)
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = walletPublicKey;
      return await solanaClient.sendAndConfirmTx((tx) => {
        tx.partialSign(userTransferAuthority);
        return wallet.signTransaction(tx);
      }, txToSign);
    }
    case SwimDefiInstruction.RemoveExactBurn: {
      if (userLpAccount === null) {
        throw new Error("Invalid user token account");
      }
      const exactBurnAmount =
        params.exactBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const minimumOutputAmount =
        params.minimumOutputAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const outputTokenIndex = params.outputTokenIndex;
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userLpAccount.address],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        walletPublicKey,
      );
      const txToSign = await twoPool.program.methods
        .removeExactBurn(exactBurnAmount, outputTokenIndex, minimumOutputAmount)
        .accounts({
          ...accountsObject,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = walletPublicKey;
      return await solanaClient.sendAndConfirmTx((tx) => {
        tx.partialSign(userTransferAuthority);
        return wallet.signTransaction(tx);
      }, txToSign);
    }
    case SwimDefiInstruction.RemoveExactOutput: {
      if (userLpAccount === null) {
        throw new Error("Invalid user token account");
      }
      const exactOutputAmounts = params.exactOutputAmounts.map((amount) =>
        amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      );
      const maximumBurnAmount =
        params.maximumBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userLpAccount.address],
        [maximumBurnAmount],
        userTransferAuthority.publicKey,
        walletPublicKey,
      );
      const txToSign = await twoPool.program.methods
        .removeExactOutput(maximumBurnAmount, exactOutputAmounts)
        .accounts({
          ...accountsObject,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = walletPublicKey;
      return await solanaClient.sendAndConfirmTx((tx) => {
        tx.partialSign(userTransferAuthority);
        return wallet.signTransaction(tx);
      }, txToSign);
    }
    case SwimDefiInstruction.RemoveUniform: {
      if (userLpAccount === null) {
        throw new Error("Invalid user token account");
      }
      const minimumOutputAmounts = params.minimumOutputAmounts.map((amount) =>
        amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      );
      const exactBurnAmount =
        params.exactBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID);
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userLpAccount.address],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        walletPublicKey,
      );
      const txToSign = await twoPool.program.methods
        .removeUniform(exactBurnAmount, minimumOutputAmounts)
        .accounts({
          ...accountsObject,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .transaction();
      // eslint-disable-next-line functional/immutable-data
      txToSign.feePayer = walletPublicKey;
      return await solanaClient.sendAndConfirmTx((tx) => {
        tx.partialSign(userTransferAuthority);
        return wallet.signTransaction(tx);
      }, txToSign);
    }
  }
};
