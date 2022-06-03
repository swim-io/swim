import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { createDraft } from "immer";
import { useMutation } from "react-query";

import { useSplTokenAccountsQuery } from "..";
import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { useSolanaConnection, useSolanaWallet } from "../../contexts";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type {
  FromSolanaTransferState,
  InteractionState,
  SolanaConnection,
  Tx,
} from "../../models";
import { getTokensByPool, getTransferredAmounts } from "../../models";
import { findOrThrow, isNotNull } from "../../utils";
import {
  doSinglePoolOperation,
  setOutputOperationInputAmount,
} from "../swim/usePoolOperationsGenerator";

const getUpdatedTransfers = async (
  interactionState: InteractionState,
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  txIds: readonly string[],
  solanaConnection: SolanaConnection,
  solanaWalletAddress: string,
  splTokenAccounts: readonly TokenAccount[],
): Promise<readonly FromSolanaTransferState[]> => {
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
  const transferredAmounts = getTransferredAmounts(
    solanaWalletAddress,
    splTokenAccounts,
    tokens,
    lpToken,
    txs,
  );

  // Update from solana transfer value
  const { fromSolanaTransfers } = interactionState;
  return fromSolanaTransfers.map((transfer) => ({
    ...transfer,
    value:
      transferredAmounts[transfer.token.id]?.toHuman(
        transfer.token.nativeEcosystem,
      ) ?? null,
  }));
};

export const useSolanaPoolOperationsMutation = () => {
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig);
  const { pools } = config;
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaConnection = useSolanaConnection();
  const { wallet, address: solanaWalletAddress } = useSolanaWallet();
  const tokensByPoolId = getTokensByPool(config);
  const { updateInteractionState, getInteractionState } = useInteractionState();

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
      const updatedTransfers = await getUpdatedTransfers(
        interactionState,
        tokens,
        lpToken,
        [inputTxId],
        solanaConnection,
        solanaWalletAddress,
        splTokenAccounts,
      );
      updateInteractionState(interaction.id, (draft) => {
        draft.fromSolanaTransfers = createDraft(updatedTransfers);
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
    const updatedTransfers = await getUpdatedTransfers(
      interactionState,
      tokens,
      lpToken,
      [inputTxId, outputTxId],
      solanaConnection,
      solanaWalletAddress,
      splTokenAccounts,
    );
    updateInteractionState(interaction.id, (draft) => {
      draft.fromSolanaTransfers = createDraft(updatedTransfers);
    });
  });
};
