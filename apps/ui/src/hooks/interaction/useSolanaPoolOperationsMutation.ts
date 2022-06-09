import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { useSolanaWallet, useSplTokenAccountsQuery } from "..";
import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { InteractionState, SolanaConnection, Tx } from "../../models";
import { getTokensByPool, getTransferredAmounts } from "../../models";
import { findOrThrow, isNotNull } from "../../utils";
import {
  doSinglePoolOperation,
  setOutputOperationInputAmount,
} from "../swim/usePoolOperationsGenerator";

const getTransferredAmountsByTokenId = async (
  interactionState: InteractionState,
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  txIds: readonly string[],
  solanaConnection: SolanaConnection,
  solanaWalletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
) => {
  const { interaction } = interactionState;
  const txs: readonly Tx[] = await Promise.all(
    txIds.map(async (txId) => {
      const parsedTx = await solanaConnection.getParsedTx(txId);
      return {
        ecosystem: EcosystemId.Solana as const,
        txId,
        timestamp: parsedTx.blockTime ?? null,
        interactionId: interaction.id,
        parsedTx,
      };
    }),
  );
  return getTransferredAmounts(
    solanaWalletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    txs,
  );
};

export const useSolanaPoolOperationsMutation = () => {
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { pools } = config;
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaConnection = useSolanaConnection();
  const { wallet, address: solanaWalletAddress } = useSolanaWallet();
  const tokensByPoolId = getTokensByPool(config);
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);

  return useMutation(async (interactionId: string) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    if (!solanaWalletAddress) {
      throw new Error("No Solana wallet address");
    }
    const interactionState = getInteractionState(interactionId);
    const { interaction, solanaPoolOperations } = interactionState;

    // Every operation is done
    if (solanaPoolOperations.every(({ txId }) => isNotNull(txId))) {
      return;
    }

    const inputState = solanaPoolOperations[0];
    const inputOperation = inputState.operation;
    const inputPoolSpec = findOrThrow(
      pools,
      (spec) => spec.id === inputOperation.poolId,
    );
    let inputTxId = inputState.txId;
    if (inputTxId === null) {
      inputTxId = await doSinglePoolOperation(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        inputPoolSpec,
        inputOperation,
      );
      // Update operation state with txId
      updateInteractionState(interaction.id, (draft) => {
        draft.solanaPoolOperations[0].txId = inputTxId;
      });
    }

    if (solanaPoolOperations.length === 1) {
      // Update from solana transfer value
      const { tokens, lpToken } = tokensByPoolId[inputPoolSpec.id];
      const transferredAmounts = await getTransferredAmountsByTokenId(
        interactionState,
        tokens,
        lpToken,
        [inputTxId],
        solanaConnection,
        solanaWalletAddress,
        splTokenAccounts,
      );
      updateInteractionState(interaction.id, (draft) => {
        for (const [index, transfer] of draft.fromSolanaTransfers.entries()) {
          const amount = transferredAmounts[transfer.token.id];
          const value = amount?.toHuman(transfer.token.nativeEcosystem) ?? null;
          if (
            draft.fromSolanaTransfers[index].value === null &&
            value !== null
          ) {
            draft.fromSolanaTransfers[index].value = value;
          }
        }
      });
      return;
    }
    if (solanaPoolOperations.length !== 2) {
      throw new Error("Unknown interaction route");
    }
    const outputState = solanaPoolOperations[1];

    // Return if output operation is already done
    if (outputState.txId !== null) {
      return;
    }

    const parsedInputTx = await solanaConnection.getParsedTx(inputTxId);
    const outputOperation = setOutputOperationInputAmount(
      splTokenAccounts,
      interaction,
      inputOperation,
      outputState.operation,
      parsedInputTx,
    );
    const outputPoolSpec = findOrThrow(
      pools,
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

    // Update operation state with txId
    updateInteractionState(interaction.id, (draft) => {
      draft.solanaPoolOperations[1].txId = outputTxId;
    });

    // Update from solana transfer value
    const { tokens, lpToken } = tokensByPoolId[outputPoolSpec.id];
    const transferredAmounts = await getTransferredAmountsByTokenId(
      interactionState,
      tokens,
      lpToken,
      [inputTxId, outputTxId],
      solanaConnection,
      solanaWalletAddress,
      splTokenAccounts,
    );
    updateInteractionState(interaction.id, (draft) => {
      for (const [index, transfer] of draft.fromSolanaTransfers.entries()) {
        const amount = transferredAmounts[transfer.token.id];
        const value = amount?.toHuman(transfer.token.nativeEcosystem) ?? null;
        if (draft.fromSolanaTransfers[index].value === null && value !== null) {
          draft.fromSolanaTransfers[index].value = value;
        }
      }
    });
  });
};
