import { useMutation } from "react-query";

import { useSplTokenAccountsQuery } from "..";
import { EcosystemId } from "../../config";
import {
  useConfig,
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import type { InteractionState, Tx } from "../../models";
import { getTokensByPool, getTransferredAmounts } from "../../models";
import { findOrThrow, isNotNull } from "../../utils";
import {
  doSinglePoolOperation,
  setOutputOperationInputAmount,
} from "../swim/usePoolOperationsGenerator";

export const useSolanaPoolOperationsMutation = () => {
  const { env } = useEnvironment();
  const config = useConfig();
  const { pools } = config;
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaConnection = useSolanaConnection();
  const { wallet, address: solanaWalletAddress } = useSolanaWallet();
  const tokensByPoolId = getTokensByPool(config);

  return useMutation(async (interactionState: InteractionState) => {
    if (wallet === null) {
      throw new Error("Missing Solana wallet");
    }
    if (!solanaWalletAddress) {
      throw new Error("No Solana wallet address");
    }
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
    const inputTxId =
      inputState.txId !== null
        ? inputState.txId
        : await doSinglePoolOperation(
            env,
            solanaConnection,
            wallet,
            splTokenAccounts,
            tokensByPoolId,
            inputPoolSpec,
            inputOperation,
          );

    // TODO: [refactor] update operation state with txId
    console.log({ inputTxId });

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

    // TODO: [refactor] update operation state with txId
    console.log({ outputTxId });

    const { tokens, lpToken } = tokensByPoolId[outputPoolSpec.id];
    const txs: readonly Tx[] = await Promise.all(
      [inputTxId, outputTxId].map(async (txId) => {
        const parsedTx = await solanaConnection.getParsedTx(txId);
        return {
          ecosystem: EcosystemId.Solana,
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

    // TODO: [refactor] Update from solana transfer value
    const { fromSolanaTransfers } = interactionState;
    const updatedTransfers = fromSolanaTransfers.map((transfer) => ({
      ...transfer,
      value: transferredAmounts[transfer.token.id] ?? null,
    }));
  });
};
