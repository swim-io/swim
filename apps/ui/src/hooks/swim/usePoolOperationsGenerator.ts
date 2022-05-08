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
  Amount,
  InteractionType,
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

const createOperations = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: Interaction,
): readonly OperationSpec[] => {
  const { id: interactionId } = interaction;
  const inputPool = poolSpecs[0];
  const outputPool = poolSpecs[poolSpecs.length - 1];
  const inputPoolTokens = tokensByPoolId[inputPool.id];
  const outputPoolTokens = tokensByPoolId[outputPool.id];

  switch (interaction.type) {
    case InteractionType.Add: {
      const { inputAmounts, minimumMintAmount } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Add,
          params: {
            inputAmounts: inputPoolTokens.tokens.map(
              (token) => inputAmounts.get(token.id) ?? Amount.zero(token),
            ),
            minimumMintAmount,
          },
        },
      ];
    }
    case InteractionType.RemoveUniform: {
      const { exactBurnAmount, minimumOutputAmounts } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveUniform,
          params: {
            exactBurnAmount,
            minimumOutputAmounts: inputPoolTokens.tokens.map(
              (token) =>
                minimumOutputAmounts.get(token.id) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.RemoveExactBurn: {
      const { exactBurnAmount, outputTokenId, minimumOutputAmount } =
        interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactBurn,
          params: {
            exactBurnAmount,
            outputTokenIndex: inputPoolTokens.tokens.findIndex(
              (token) => token.id === outputTokenId,
            ),
            minimumOutputAmount,
          },
        },
      ];
    }
    case InteractionType.RemoveExactOutput: {
      const { maximumBurnAmount, exactOutputAmounts } = interaction.params;
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.RemoveExactOutput,
          params: {
            maximumBurnAmount,
            exactOutputAmounts: inputPoolTokens.tokens.map(
              (token) => exactOutputAmounts.get(token.id) ?? Amount.zero(token),
            ),
          },
        },
      ];
    }
    case InteractionType.Swap: {
      const { exactInputAmounts, outputTokenId, minimumOutputAmount } =
        interaction.params;
      if (inputPool.id === outputPool.id) {
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === outputTokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      const hexapoolId = "hexapool";
      const inputPoolIsHexapool = inputPool.id === hexapoolId;
      const outputPoolIsHexapool = outputPool.id === hexapoolId;

      if (inputPoolIsHexapool) {
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Add,
            params: {
              inputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
              ),
              // TODO: Handle min amount
              minimumMintAmount: Amount.zero(inputPoolTokens.lpToken),
            },
          },
          {
            interactionId,
            poolId: outputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              // TODO: Handle input amounts
              exactInputAmounts: outputPoolTokens.tokens.map((token) =>
                Amount.zero(token),
              ),
              outputTokenIndex: outputPoolTokens.tokens.findIndex(
                (token) => token.id === minimumOutputAmount.tokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      if (outputPoolIsHexapool) {
        return [
          {
            interactionId,
            poolId: inputPool.id,
            instruction: SwimDefiInstruction.Swap,
            params: {
              exactInputAmounts: inputPoolTokens.tokens.map(
                (token) =>
                  exactInputAmounts.get(token.id) ?? Amount.zero(token),
              ),
              outputTokenIndex: inputPoolTokens.tokens.findIndex(
                (token) => token.id === outputPool.lpToken,
              ),
              // TODO: Handle min amount
              minimumOutputAmount,
            },
          },
          {
            interactionId,
            poolId: outputPool.id,
            instruction: SwimDefiInstruction.RemoveExactBurn,
            params: {
              // TODO: Handle burn amount
              exactBurnAmount: Amount.zero(outputPoolTokens.lpToken),
              outputTokenIndex: outputPoolTokens.tokens.findIndex(
                (token) => token.id === outputTokenId,
              ),
              minimumOutputAmount,
            },
          },
        ];
      }

      //  Metapool to metapool
      const inputPoolOutputTokenIndex = inputPoolTokens.tokens.findIndex(
        (inputPoolToken) =>
          outputPoolTokens.tokens.some(
            (outputPoolToken) => outputPoolToken.id === inputPoolToken.id,
          ),
      );
      const lpToken = inputPoolTokens.tokens[inputPoolOutputTokenIndex];
      return [
        {
          interactionId,
          poolId: inputPool.id,
          instruction: SwimDefiInstruction.Swap,
          params: {
            exactInputAmounts: inputPoolTokens.tokens.map(
              (token) => exactInputAmounts.get(token.id) ?? Amount.zero(token),
            ),
            outputTokenIndex: inputPoolOutputTokenIndex,
            // TODO: Handle min amount
            minimumOutputAmount: Amount.zero(lpToken),
          },
        },
        {
          interactionId,
          poolId: outputPool.id,
          instruction: SwimDefiInstruction.Swap,
          params: {
            // TODO: Handle input amounts
            exactInputAmounts: inputPoolTokens.tokens.map((token) =>
              Amount.zero(token),
            ),
            outputTokenIndex: outputPoolTokens.tokens.findIndex(
              (token) => token.id === outputTokenId,
            ),
            minimumOutputAmount,
          },
        },
      ];
    }
    default:
      throw new Error("Unknown interaction type");
  }
};

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
      return instructor.createAllAddIxs(operation, userTransferAuthority);
    case SwimDefiInstruction.RemoveUniform:
      return instructor.createAllRemoveUniformIxs(
        operation,
        userTransferAuthority,
      );
    case SwimDefiInstruction.RemoveExactBurn:
      return instructor.createAllRemoveExactBurnIxs(
        operation,
        userTransferAuthority,
      );
    case SwimDefiInstruction.RemoveExactOutput:
      return instructor.createAllRemoveExactOutputIxs(
        operation,
        userTransferAuthority,
      );
    case SwimDefiInstruction.Swap:
      return instructor.createAllSwapIxs(operation, userTransferAuthority);
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
): AsyncGenerator<SolanaTx> {
  const operations = createOperations(tokensByPoolId, poolSpecs, interaction);
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
    operations.map((operation) => {
      const poolSpec = findOrThrow(
        poolSpecs,
        (spec) => spec.id === operation.poolId,
      );
      const ixs = createPoolIxs(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        poolSpec,
        operation,
        userTransferAuthority,
      );
      return ixs;
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

export const usePoolOperationsGenerator = (): UseAsyncGeneratorResult<
  WithSplTokenAccounts<Interaction>,
  SolanaTx
> => {
  const { env } = useEnvironment();
  const config = useConfig();
  const tokensByPoolId = getTokensByPool(config);
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  return useAsyncGenerator<WithSplTokenAccounts<Interaction>, SolanaTx>(
    async (interaction) => {
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
      );
    },
  );
};
