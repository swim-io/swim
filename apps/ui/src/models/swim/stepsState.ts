import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

import type { Config, TokenSpec } from "../../config";
import { EcosystemId, Protocol, getSolanaTokenDetails } from "../../config";
import type { Tx } from "../crossEcosystem";
import { findTokenAccountForMint } from "../solana";

import type { Interaction } from "./interaction";
import { getTokensByPool } from "./pool";
import {
  findPoolOperationTxs,
  getRequiredPools,
  getRequiredTokens,
  getTransferFromTxs,
  getTransferToTxs,
} from "./steps";
import type {
  CreatedSplTokenAccountsState,
  InitiatedState,
  State,
  TransferredToSolanaState,
} from "./stepsReducer";
import {
  ActionType,
  Status,
  completeCreateSplTokenAccounts,
  initialState,
  initiateInteraction,
  updatePoolOperations,
  updateTransferFromSolana,
  updateTransferToSolana,
} from "./stepsReducer";
import {
  generateSignatureSetKeypairs,
  getSignatureSetAddresses,
} from "./utils";

const hasAllSplTokenAccounts = (
  walletAddress: string,
  splTokenAccounts: readonly TokenAccountInfo[],
  tokens: readonly TokenSpec[],
): boolean =>
  tokens.every((token) => {
    const mint = getSolanaTokenDetails(token).address;
    const tokenAccount = findTokenAccountForMint(
      mint,
      walletAddress,
      splTokenAccounts,
    );
    return tokenAccount !== null;
  });

export const getCurrentState = (
  config: Config,
  interaction: Interaction,
  splTokenAccounts: readonly TokenAccountInfo[],
  txs: readonly Tx[],
): State => {
  const tokensByPoolId = getTokensByPool(config);
  const requiredPools = getRequiredPools(config.pools, interaction);
  const inputPool = requiredPools[0];
  const outputPool = requiredPools[requiredPools.length - 1];
  const inputPoolTokens = tokensByPoolId[inputPool.id];
  const outputPoolTokens = tokensByPoolId[outputPool.id];

  const interactionWithNewKeys: Interaction = {
    ...interaction,
    signatureSetKeypairs: generateSignatureSetKeypairs(
      inputPoolTokens.tokens,
      inputPoolTokens.lpToken,
      interaction,
      null,
    ),
    previousSignatureSetAddresses: {
      ...interaction.previousSignatureSetAddresses,
      ...getSignatureSetAddresses(interaction.signatureSetKeypairs),
    },
  };
  const initiatedState: InitiatedState = initiateInteraction(initialState, {
    type: ActionType.InitiateInteraction,
    config,
    splTokenAccounts,
    interaction: interactionWithNewKeys,
    txs,
  });
  const requiredTokens = getRequiredTokens(
    tokensByPoolId,
    requiredPools,
    interaction,
  );
  const walletAddress = interaction.connectedWallets[EcosystemId.Solana];
  if (walletAddress === null) {
    throw new Error("Missing Solana wallet");
  }
  if (
    !hasAllSplTokenAccounts(walletAddress, splTokenAccounts, requiredTokens)
  ) {
    return initiatedState;
  }
  const transferToTxs = getTransferToTxs(
    config.chains,
    walletAddress,
    splTokenAccounts,
    inputPoolTokens.tokens,
    inputPoolTokens.lpToken,
    interaction.previousSignatureSetAddresses,
    txs,
  );
  const createdSplTokenAccountsState: CreatedSplTokenAccountsState =
    completeCreateSplTokenAccounts(initiatedState, {
      type: ActionType.CompleteCreateSplTokenAccounts,
      splTokenAccounts,
      existingTransferToTxs: transferToTxs,
    });
  const maybeTransferredToSolanaState:
    | CreatedSplTokenAccountsState
    | TransferredToSolanaState = updateTransferToSolana(
    config.chains[Protocol.Solana][0],
    createdSplTokenAccountsState,
    {
      type: ActionType.UpdateTransferToSolana,
      txs: transferToTxs,
    },
  );
  if (maybeTransferredToSolanaState.status !== Status.TransferredToSolana) {
    return maybeTransferredToSolanaState;
  }
  const poolOperationTxs = findPoolOperationTxs(requiredPools, txs);
  const transferFromTxs = getTransferFromTxs(
    config.chains,
    walletAddress,
    splTokenAccounts,
    outputPoolTokens.tokens,
    outputPoolTokens.lpToken,
    txs,
  );
  const maybeCompletedPoolOperationsState = updatePoolOperations(
    tokensByPoolId,
    requiredPools,
    maybeTransferredToSolanaState,
    {
      type: ActionType.UpdatePoolOperations,
      operationTxs: poolOperationTxs,
      existingTransferFromTxs: transferFromTxs,
    },
  );
  if (
    maybeCompletedPoolOperationsState.status !== Status.CompletedPoolOperations
  ) {
    return maybeCompletedPoolOperationsState;
  }
  const maybeDoneState = updateTransferFromSolana(
    config.chains[Protocol.Evm],
    maybeCompletedPoolOperationsState,
    {
      type: ActionType.UpdateTransferFromSolana,
      txs: transferFromTxs,
    },
  );
  return maybeDoneState;
};
