import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

import type { Config, TokenSpec } from "../../config";
import { EcosystemId, Protocol, getSolanaTokenDetails } from "../../config";
import { findOrThrow } from "../../utils";
import type { Tx } from "../crossEcosystem";
import { findTokenAccountForMint } from "../solana";

import type { Interaction } from "./interaction";
import {
  findPoolInteractionTx,
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
  completePoolInteraction,
  initialState,
  initiateInteraction,
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
  splTokenAccounts: readonly TokenAccountInfo[],
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: Interaction,
  txs: readonly Tx[],
): State => {
  const poolSpec = findOrThrow(
    config.pools,
    (pool) => pool.id === interaction.poolId,
  );
  const poolContractAddress = poolSpec.contract;

  const interactionWithNewKeys: Interaction = {
    ...interaction,
    signatureSetKeypairs: generateSignatureSetKeypairs(
      tokens,
      lpToken,
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
  const requiredTokens = getRequiredTokens(tokens, lpToken, interaction);
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
    tokens,
    lpToken,
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
  const poolInteractionTx = findPoolInteractionTx(poolContractAddress, txs);
  if (poolInteractionTx === null) {
    return maybeTransferredToSolanaState;
  }
  const lpTokenMint = getSolanaTokenDetails(lpToken).address;
  const tokenMints = tokens.map(
    (token) => getSolanaTokenDetails(token).address,
  );
  const transferFromTxs = getTransferFromTxs(
    config.chains,
    walletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    txs,
  );
  const completedPoolInteractionState = completePoolInteraction(
    tokens,
    lpToken,
    maybeTransferredToSolanaState,
    {
      type: ActionType.CompletePoolInteraction,
      lpTokenMint,
      tokenMints,
      interactionTxs: [poolInteractionTx],
      existingTransferFromTxs: transferFromTxs,
    },
  );
  const maybeDoneState = updateTransferFromSolana(
    config.chains[Protocol.Evm],
    completedPoolInteractionState,
    {
      type: ActionType.UpdateTransferFromSolana,
      txs: transferFromTxs,
    },
  );
  return maybeDoneState;
};
