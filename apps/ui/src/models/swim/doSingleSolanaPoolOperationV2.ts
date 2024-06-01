import type { BN, SplToken } from "@project-serum/anchor";
import { AnchorProvider, Program, Spl, web3 } from "@project-serum/anchor";
import type { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type {
  SolanaClient,
  SolanaWalletAdapter,
  TokenAccount,
} from "@swim-io/solana";
import {
  SOLANA_ECOSYSTEM_ID,
  createMemoIx,
  findTokenAccountForMint,
} from "@swim-io/solana";
import { idl } from "@swim-io/solana-contracts";

import type { SolanaPoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";

import { SwimDefiInstruction } from "./instructions";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";

const getApproveAndRevokeIxs = async (
  splToken: Program<SplToken>,
  tokenAccounts: ReadonlyArray<web3.PublicKey>,
  amounts: ReadonlyArray<BN>,
  delegate: web3.PublicKey,
  authority: web3.PublicKey,
): Promise<
  readonly [
    readonly TransactionInstruction[],
    readonly TransactionInstruction[],
  ]
> => {
  const approveIxs = Promise.all(
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
  const revokeIxs = Promise.all(
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
  return Promise.all([approveIxs, revokeIxs]);
};

export const doSingleSolanaPoolOperationV2 = async ({
  solanaClient,
  wallet,
  splTokenAccounts,
  poolTokens,
  poolSpec,
  operation,
  interactionId,
}: {
  readonly solanaClient: SolanaClient;
  readonly wallet: SolanaWalletAdapter;
  readonly splTokenAccounts: readonly TokenAccount[];
  readonly poolTokens: TokensByPoolId[string];
  readonly poolSpec: SolanaPoolSpec;
  readonly operation: OperationSpec;
  readonly interactionId: string;
}): Promise<string> => {
  if (poolSpec.isLegacyPool) {
    throw new Error("Invalid pool version");
  }
  const walletPublicKey = wallet.publicKey;
  if (walletPublicKey === null) {
    throw new Error("Invalid wallet");
  }
  const walletAddress = walletPublicKey.toBase58();
  const poolState = await solanaClient.getPoolState(poolSpec.id);
  const lpTokenMintAddress = getSolanaTokenDetails(poolTokens.lpToken).address;
  const userLpAccount = findTokenAccountForMint(
    lpTokenMintAddress,
    walletAddress,
    splTokenAccounts,
  );
  const tokenMintAddresses = poolTokens.tokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const poolTokenAccounts = [...poolSpec.tokenAccounts.values()];
  const userTokenAccounts = tokenMintAddresses.map((mint) =>
    findTokenAccountForMint(mint, walletAddress, splTokenAccounts),
  );
  const provider = new AnchorProvider(
    solanaClient.connection,
    {
      publicKey: walletPublicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    },
    {},
  );
  const twoPool = new Program(
    idl.twoPool,
    new PublicKey(poolSpec.contract),
    provider,
  );
  const splToken = Spl.token(provider);
  const userTransferAuthority = web3.Keypair.generate();
  const userTokenAccount0 = userTokenAccounts[0]?.address ?? null;
  const userTokenAccount1 = userTokenAccounts[1]?.address ?? null;
  if (userTokenAccount0 === null || userTokenAccount1 === null) {
    throw new Error("Invalid user token account");
  }
  const commonAccounts = {
    poolTokenAccount0: new PublicKey(poolTokenAccounts[0]),
    poolTokenAccount1: new PublicKey(poolTokenAccounts[1]),
    lpMint: new PublicKey(lpTokenMintAddress),
    governanceFee: poolState.governanceFeeKey,
    userTransferAuthority: userTransferAuthority.publicKey,
    userTokenAccount0: userTokenAccount0,
    userTokenAccount1: userTokenAccount1,
    tokenProgram: splToken.programId,
  };
  const { instruction, params } = operation;
  const memoIx = createMemoIx(interactionId, []);
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
      const txToSign = await twoPool.methods
        .add(inputAmounts, minimumMintAmount)
        .accounts({
          ...commonAccounts,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs, memoIx])
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
      const txToSign = await twoPool.methods
        .swapExactInput(inputAmounts, outputTokenIndex, minimumOutputAmount)
        .accounts(commonAccounts)
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs, memoIx])
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
      const txToSign = await twoPool.methods
        .removeExactBurn(exactBurnAmount, outputTokenIndex, minimumOutputAmount)
        .accounts({
          ...commonAccounts,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs, memoIx])
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
      const txToSign = await twoPool.methods
        .removeExactOutput(maximumBurnAmount, exactOutputAmounts)
        .accounts({
          ...commonAccounts,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs, memoIx])
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
      const txToSign = await twoPool.methods
        .removeUniform(exactBurnAmount, minimumOutputAmounts)
        .accounts({
          ...commonAccounts,
          userLpTokenAccount: userLpAccount.address,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs, memoIx])
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
