import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type Decimal from "decimal.js";

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
  SwimDefiInstruction,
  SwimDefiInstructor,
  findTokenAccountForMint,
  getAmountMintedToAccountByMint,
  getAmountTransferredToAccountByMint,
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

const getTransferredAmount = (
  inputOperationSpec: OperationSpec,
  mintAddress: string,
  walletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
  tx: ParsedTransactionWithMeta,
): Decimal =>
  inputOperationSpec.instruction === SwimDefiInstruction.Add
    ? getAmountMintedToAccountByMint(
        splTokenAccounts,
        tx,
        mintAddress,
        walletAddress,
      )
    : getAmountTransferredToAccountByMint(
        splTokenAccounts,
        tx,
        mintAddress,
        walletAddress,
      );

const setOutputOperationInputAmount = (
  splTokenAccounts: readonly TokenAccount[],
  interaction: Interaction,
  inputOperationSpec: OperationSpec,
  outputOperationSpec: OperationSpec,
  tx: ParsedTransactionWithMeta,
): OperationSpec => {
  const walletAddress = interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }

  switch (outputOperationSpec.instruction) {
    case SwimDefiInstruction.Add: {
      const inputAmount = findOrThrow(
        outputOperationSpec.params.inputAmounts,
        (amount) => !amount.isZero(),
      );
      const mintAddress = getSolanaTokenDetails(inputAmount.tokenSpec).address;
      const decimalAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        decimalAmount,
        EcosystemId.Solana,
      );
      return {
        ...outputOperationSpec,
        params: {
          ...outputOperationSpec.params,
          inputAmounts: outputOperationSpec.params.inputAmounts.map((amount) =>
            amount.tokenId === inputAmount.tokenId ? newInputAmount : amount,
          ),
        },
      };
    }
    case SwimDefiInstruction.RemoveExactBurn: {
      const inputAmount = outputOperationSpec.params.exactBurnAmount;
      const mintAddress = getSolanaTokenDetails(inputAmount.tokenSpec).address;
      const decimalAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        decimalAmount,
        EcosystemId.Solana,
      );
      return {
        ...outputOperationSpec,
        params: {
          ...outputOperationSpec.params,
          exactBurnAmount: newInputAmount,
        },
      };
    }
    case SwimDefiInstruction.Swap: {
      const inputAmount = findOrThrow(
        outputOperationSpec.params.exactInputAmounts,
        (amount) => !amount.isZero(),
      );
      const mintAddress = getSolanaTokenDetails(inputAmount.tokenSpec).address;
      const decimalAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        decimalAmount,
        EcosystemId.Solana,
      );
      return {
        ...outputOperationSpec,
        params: {
          ...outputOperationSpec.params,
          exactInputAmounts: outputOperationSpec.params.exactInputAmounts.map(
            (amount) =>
              amount.tokenId === inputAmount.tokenId ? newInputAmount : amount,
          ),
        },
      };
    }
    // NOTE: Multi-operation swaps should not involve these instructions
    case SwimDefiInstruction.RemoveUniform:
    case SwimDefiInstruction.RemoveExactOutput:
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
  const inputOperation = operations[0];
  const inputPoolSpec = findOrThrow(
    poolSpecs,
    (spec) => spec.id === inputOperation.poolId,
  );
  const inputTxId = await doSinglePoolOperation(
    env,
    solanaConnection,
    wallet,
    splTokenAccounts,
    tokensByPoolId,
    inputPoolSpec,
    inputOperation,
  );
  const inputTx = await solanaConnection.getParsedTx(inputTxId);
  yield {
    ecosystem: EcosystemId.Solana,
    txId: inputTxId,
    timestamp: inputTx.blockTime ?? null,
    interactionId: interaction.id,
    parsedTx: inputTx,
  };

  if (operations.length === 1) {
    return;
  }
  if (operations.length !== 2) {
    throw new Error("Unknown interaction route");
  }

  const outputOperation = setOutputOperationInputAmount(
    splTokenAccounts,
    interaction,
    inputOperation,
    operations[1],
    inputTx,
  );
  const outputPoolSpec = findOrThrow(
    poolSpecs,
    (spec) => spec.id === outputOperation.poolId,
  );
  const outputTxId = await doSinglePoolOperation(
    env,
    solanaConnection,
    wallet,
    splTokenAccounts,
    tokensByPoolId,
    outputPoolSpec,
    outputOperation,
  );
  const outputTx = await solanaConnection.getParsedTx(outputTxId);
  yield {
    ecosystem: EcosystemId.Solana,
    txId: outputTxId,
    timestamp: outputTx.blockTime ?? null,
    interactionId: interaction.id,
    parsedTx: outputTx,
  };
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
