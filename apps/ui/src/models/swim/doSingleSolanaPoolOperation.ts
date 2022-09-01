import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import type { TokenAccount } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type Decimal from "decimal.js";

import type { SolanaPoolSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { Amount } from "../amount";
import type { SolanaConnection } from "../solana";
import {
  findTokenAccountForMint,
  getAmountMintedToAccountByMint,
  getAmountTransferredToAccountByMint,
} from "../solana";
import type { SolanaWalletAdapter } from "../wallets";

import { SwimDefiInstructor } from "./SwimDefiInstructor";
import { SwimDefiInstruction } from "./instructions";
import type { Interaction } from "./interaction";
import type { OperationSpec } from "./operation";
import type { TokensByPoolId } from "./pool";
import { getSolanaPoolState } from "./pool";

export const doSingleSolanaPoolOperation = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpec: SolanaPoolSpec,
  operation: OperationSpec,
): Promise<string> => {
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  const poolState = await getSolanaPoolState(solanaConnection, poolSpec);
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
    case SwimDefiInstruction.Add:
      return instructor.add(operation, splTokenAccounts);
    case SwimDefiInstruction.RemoveUniform:
      return instructor.removeUniform(operation, splTokenAccounts);
    case SwimDefiInstruction.RemoveExactBurn:
      return instructor.removeExactBurn(operation, splTokenAccounts);
    case SwimDefiInstruction.RemoveExactOutput:
      return instructor.removeExactOutput(operation, splTokenAccounts);
    case SwimDefiInstruction.Swap:
      return instructor.swap(operation, splTokenAccounts);
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

export const setOutputOperationInputAmount = (
  splTokenAccounts: readonly TokenAccount[],
  interaction: Interaction,
  inputOperationSpec: OperationSpec,
  outputOperationSpec: OperationSpec,
  tx: ParsedTransactionWithMeta,
): OperationSpec => {
  const walletAddress = interaction.connectedWallets[SOLANA_ECOSYSTEM_ID];
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
      const transferredAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        transferredAmount,
        SOLANA_ECOSYSTEM_ID,
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
      const transferredAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        transferredAmount,
        SOLANA_ECOSYSTEM_ID,
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
      const transferredAmount = getTransferredAmount(
        inputOperationSpec,
        mintAddress,
        walletAddress,
        splTokenAccounts,
        tx,
      );
      const newInputAmount = Amount.fromAtomic(
        inputAmount.tokenSpec,
        transferredAmount,
        SOLANA_ECOSYSTEM_ID,
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
