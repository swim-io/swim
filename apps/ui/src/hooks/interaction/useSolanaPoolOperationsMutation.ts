import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { QueryClient } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import { useSplTokenAccountsQuery } from "..";
import type { Env, PoolSpec } from "../../config";
import { EcosystemId } from "../../config";
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
  Tx,
} from "../../models";
import { getTokensByPool } from "../../models";
import { findOrThrow } from "../../utils";
import {
  doSinglePoolOperation,
  setOutputOperationInputAmount,
} from "../swim/usePoolOperationsGenerator";

import type { SolanaPoolOperationState } from "./useInteractionState";

const handlePoolOperation = async (
  env: Env,
  solanaConnection: SolanaConnection,
  wallet: SolanaWalletAdapter,
  splTokenAccounts: readonly TokenAccount[],
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  operation: OperationSpec,
  interactionId: string,
  queryClient: QueryClient,
): Promise<SolanaTx> => {
  const outputPoolSpec = findOrThrow(
    poolSpecs,
    (spec) => spec.id === operation.poolId,
  );
  const txId = await doSinglePoolOperation(
    env,
    solanaConnection,
    wallet,
    splTokenAccounts,
    tokensByPoolId,
    outputPoolSpec,
    operation,
  );
  const parsedTx = await solanaConnection.getParsedTx(txId);
  const tx: Tx = {
    ecosystem: EcosystemId.Solana,
    txId,
    timestamp: parsedTx.blockTime ?? null,
    interactionId,
    parsedTx: parsedTx,
  };
  queryClient.setQueryData<readonly Tx[]>(
    [env, "txsForInteraction", interactionId, EcosystemId.Solana],
    (txs) => [tx, ...(txs ?? [])],
  );
  return tx;
};

export const useSolanaPoolOperationsMutation = () => {
  const { env } = useEnvironment();
  const config = useConfig();
  const { pools } = config;
  const queryClient = useQueryClient();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaConnection = useSolanaConnection();
  const { wallet } = useSolanaWallet();
  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async ({
      interaction,
      operationsState,
    }: {
      readonly interaction: Interaction;
      readonly operationsState: readonly SolanaPoolOperationState[];
    }) => {
      if (wallet === null) {
        throw new Error("Missing Solana wallet");
      }
      const inputState = operationsState[0];
      const inputOperation = inputState.operation;
      const inputTx =
        inputState.tx ??
        (await handlePoolOperation(
          env,
          solanaConnection,
          wallet,
          splTokenAccounts,
          tokensByPoolId,
          pools,
          inputOperation,
          interaction.id,
          queryClient,
        ));

      if (operationsState.length === 1) {
        return;
      }
      if (operationsState.length !== 2) {
        throw new Error("Unknown interaction route");
      }
      const outputState = operationsState[1];
      if (outputState.tx) {
        return;
      }
      const outputOperation = setOutputOperationInputAmount(
        splTokenAccounts,
        interaction,
        inputOperation,
        outputState.operation,
        inputTx.parsedTx,
      );
      await handlePoolOperation(
        env,
        solanaConnection,
        wallet,
        splTokenAccounts,
        tokensByPoolId,
        pools,
        outputOperation,
        interaction.id,
        queryClient,
      );
    },
  );
};
