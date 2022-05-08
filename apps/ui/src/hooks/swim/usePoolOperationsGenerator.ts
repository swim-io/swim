import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import type { Env, PoolSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import {
  useConfig,
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import type {
  Interaction,
  OperationSpec,
  SolanaConnection,
  SolanaTx,
  SolanaWalletAdapter,
  TokensByPoolId,
  WithSplTokenAccounts,
} from "../../models";
import {
  SwimDefiInstruction,
  SwimDefiInstructor,
  createMemoIx,
  findTokenAccountForMint,
  getPoolState,
  getRequiredPools,
  getTokensByPool,
} from "../../models";
import { findOrThrow } from "../../utils";
import { useSplTokenAccountsQuery } from "../solana";
import type { UseAsyncGeneratorResult } from "../utils";
import { useAsyncGenerator } from "../utils";

const doSinglePoolOperation = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpec: PoolSpec,
  operation: OperationSpec,
): Promise<string> => {
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const poolState = await getPoolState(solanaConnection, poolSpec);
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
  const instructor = new SwimDefiInstructor(
    env,
    solanaConnection,
    wallet,
    poolSpec.contract,
    poolSpec.address,
    poolSpec.authority,
    lpTokenMintAddress,
    poolState.governanceFeeKey.toBase58(),
    tokenMintAddresses,
    [...poolSpec.tokenAccounts.values()],
    userLpAccount?.address.toBase58(),
    userTokenAccounts.map((t) => t?.address.toBase58() ?? null),
  );

  const operationWithSplTokenAccounts = {
    ...operation,
    splTokenAccounts,
  };

  switch (operationWithSplTokenAccounts.instruction) {
    case SwimDefiInstruction.Add:
      return instructor.add(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveUniform:
      return instructor.removeUniform(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveExactBurn:
      return instructor.removeExactBurn(operationWithSplTokenAccounts);
    case SwimDefiInstruction.RemoveExactOutput:
      return instructor.removeExactOutput(operationWithSplTokenAccounts);
    case SwimDefiInstruction.Swap:
      return instructor.swap(operationWithSplTokenAccounts);
    default:
      throw new Error("Unknown instruction");
  }
};

const createPoolIxs = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpec: PoolSpec,
  operation: OperationSpec,
  userTransferAuthority: Keypair,
): Promise<readonly TransactionInstruction[]> => {
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const poolState = await getPoolState(solanaConnection, poolSpec);
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
  const instructor = new SwimDefiInstructor(
    env,
    solanaConnection,
    wallet,
    poolSpec.contract,
    poolSpec.address,
    poolSpec.authority,
    lpTokenMintAddress,
    poolState.governanceFeeKey.toBase58(),
    tokenMintAddresses,
    [...poolSpec.tokenAccounts.values()],
    userLpAccount?.address.toBase58(),
    userTokenAccounts.map((t) => t?.address.toBase58() ?? null),
  );
  switch (operation.instruction) {
    // TODO: Fill out
    case SwimDefiInstruction.Add:
      return instructor.createAllAddIxs(
        operation,
        userTransferAuthority,
        false,
      );
    case SwimDefiInstruction.RemoveUniform:
      return instructor.createAllRemoveUniformIxs(
        operation,
        userTransferAuthority,
        false,
      );
    case SwimDefiInstruction.RemoveExactBurn:
      return instructor.createAllRemoveExactBurnIxs(
        operation,
        userTransferAuthority,
        false,
      );
    case SwimDefiInstruction.RemoveExactOutput:
      return instructor.createAllRemoveExactOutputIxs(
        operation,
        userTransferAuthority,
        false,
      );
    case SwimDefiInstruction.Swap:
      return instructor.createAllSwapIxs(
        operation,
        userTransferAuthority,
        false,
      );
    default:
      throw new Error("Unknown instruction");
  }
};

async function* generatePoolOperationTxs(
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
  operations: readonly OperationSpec[],
): AsyncGenerator<SolanaTx> {
  if (operations.length === 1) {
    const [operation] = operations;
    const poolSpec = findOrThrow(
      poolSpecs,
      (spec) => spec.id === operation.poolId,
    );
    const txId = await doSinglePoolOperation(
      env,
      solanaConnection,
      wallet,
      splTokenAccounts,
      tokensByPoolId,
      poolSpec,
      operation,
    );
    const tx = await solanaConnection.getParsedTx(txId);
    yield {
      ecosystem: EcosystemId.Solana,
      txId,
      timestamp: tx.blockTime ?? null,
      interactionId: interaction.id,
      parsedTx: tx,
    };
    return;
  }
  if (operations.length !== 2) {
    throw new Error("Unknown interaction route");
  }

  // TODO: Refactor if this works
  const userTransferAuthority = Keypair.generate();
  const poolIxs = await Promise.all(
    operations.map(async (operation) => {
      const poolSpec = findOrThrow(
        poolSpecs,
        (spec) => spec.id === operation.poolId,
      );
      return createPoolIxs(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpec,
        operation,
        userTransferAuthority,
      );
    }),
  );
  const memoIx = createMemoIx(interaction.id, []);
  const tx = new Transaction({
    feePayer: wallet.publicKey,
  });
  tx.add(...poolIxs.flat(), memoIx);
  const signTransaction = async (
    txToSign: Transaction,
  ): Promise<Transaction> => {
    txToSign.partialSign(userTransferAuthority);
    return wallet.signTransaction(txToSign);
  };
  const txId = await solanaConnection.sendAndConfirmTx(signTransaction, tx);
  const parsedTx = await solanaConnection.getParsedTx(txId);
  yield {
    ecosystem: EcosystemId.Solana,
    txId,
    timestamp: parsedTx.blockTime ?? null,
    interactionId: interaction.id,
    parsedTx,
  };
  return;

  // TODO: Re-enable if multiple ixs per tx fails
  // for (const operation of operations) {
  //   const poolSpec = findOrThrow(
  //     poolSpecs,
  //     (spec) => spec.id === operation.poolId,
  //   );
  //   const txId = await doSinglePoolOperation(
  //     env,
  //     solanaConnection,
  //     wallet,
  //     splTokenAccounts,
  //     tokensByPoolId,
  //     poolSpec,
  //     operation,
  //   );
  //   const tx = await solanaConnection.getParsedTx(txId);
  //   yield {
  //     ecosystem: EcosystemId.Solana,
  //     txId,
  //     timestamp: tx.blockTime ?? null,
  //     interactionId: operation.interactionId,
  //     parsedTx: tx,
  //   };
  // }
}

export interface PoolOperationsInput {
  readonly interaction: Interaction;
  readonly operations: readonly OperationSpec[];
}

export const usePoolOperationsGenerator = (): UseAsyncGeneratorResult<
  WithSplTokenAccounts<PoolOperationsInput>,
  SolanaTx
> => {
  const { env } = useEnvironment();
  const config = useConfig();
  const tokensByPoolId = getTokensByPool(config);
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  return useAsyncGenerator<WithSplTokenAccounts<PoolOperationsInput>, SolanaTx>(
    async ({ interaction, operations }) => {
      const poolSpecs = getRequiredPools(config.pools, interaction);
      if (wallet === null) {
        throw new Error("Missing Solana wallet");
      }
      if (splTokenAccounts === null) {
        throw new Error("SPL token accounts not yet loaded");
      }
      return generatePoolOperationTxs(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpecs,
        interaction,
        operations,
      );
    },
  );
};
