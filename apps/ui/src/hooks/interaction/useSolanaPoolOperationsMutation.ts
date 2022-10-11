import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow, isNotNull } from "@swim-io/utils";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  doSingleSolanaPoolOperation,
  getTokensByPool,
  setOutputOperationInputAmount,
} from "../../models";
import {
  useSolanaClient,
  useSolanaWallet,
  useSplTokenAccountsQuery,
} from "../solana";

export const useSolanaPoolOperationsMutation = () => {
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const { pools } = config;
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaClient = useSolanaClient();
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
    const outputState = solanaPoolOperations[solanaPoolOperations.length - 1];
    const inputOperation = inputState.operation;
    const inputPoolSpec = findOrThrow(
      pools,
      (spec) => spec.id === inputOperation.poolId,
    );
    const outputPoolSpec = findOrThrow(
      pools,
      (spec) => spec.id === outputState.operation.poolId,
    );
    if (inputPoolSpec.ecosystem !== SOLANA_ECOSYSTEM_ID) {
      throw new Error("Expect Solana pool");
    }
    if (outputPoolSpec.ecosystem !== SOLANA_ECOSYSTEM_ID) {
      throw new Error("Expect Solana pool");
    }

    let inputTxId = inputState.txId;
    if (inputTxId === null) {
      inputTxId = await doSingleSolanaPoolOperation(
        env,
        solanaClient,
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
      return;
    }
    if (solanaPoolOperations.length !== 2) {
      throw new Error("Unknown interaction route");
    }
    // Return if output operation is already done
    if (outputState.txId !== null) {
      return;
    }
    const inputTx = await solanaClient.getTx(inputTxId);
    const outputOperation = setOutputOperationInputAmount(
      splTokenAccounts,
      interaction,
      inputOperation,
      outputState.operation,
      inputTx,
    );
    const outputTxId = await doSingleSolanaPoolOperation(
      env,
      solanaClient,
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
  });
};
