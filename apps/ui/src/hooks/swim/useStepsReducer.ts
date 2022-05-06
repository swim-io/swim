import * as Sentry from "@sentry/react";
import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import type { Dispatch, Reducer } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { UseMutationResult } from "react-query";
import { useQueryClient } from "react-query";

import { EcosystemId, isEvmEcosystemId } from "../../config";
import {
  useActiveInteractionContext,
  useConfig,
  useEnvironment,
} from "../../contexts";
import { captureAndWrapException } from "../../errors";
import {
  ActionType,
  InteractionType,
  Status,
  combineTransfers,
  generateId,
  generateSignatureSetKeypairs,
  getConnectedWallets,
  getSignatureSetAddresses,
  groupTxsByTokenId,
  initialState,
  isInProgress,
  reducer,
  storeInteraction,
} from "../../models";
import type {
  Action,
  InitiateInteractionAction,
  Interaction,
  InteractionSpec,
  SolanaTx,
  State,
  Transfer,
  TransfersToSolanaWithExistingTxs,
  TransfersWithExistingTxs,
  TxWithTokenId,
  WithSplTokenAccounts,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import {
  useCreateSplTokenAccountsMutation,
  useSplTokenAccountsQuery,
} from "../solana";
import type { UseAsyncGeneratorResult } from "../utils";
import {
  useTransferEvmTokensToSolanaGenerator,
  useTransferSplTokensToEvmGenerator,
} from "../wormhole";

import { usePool } from "./usePool";
import { usePoolOperationsGenerator } from "./usePoolOperationsGenerator";

export interface StepMutations {
  readonly createSplTokenAccounts: UseMutationResult<
    readonly TokenAccountInfo[],
    Error,
    readonly string[]
  >;
  readonly wormholeToSolana: UseAsyncGeneratorResult<
    WithSplTokenAccounts<TransfersToSolanaWithExistingTxs>,
    TxWithTokenId
  >;
  readonly doPoolOperations: UseAsyncGeneratorResult<
    WithSplTokenAccounts<Interaction>,
    SolanaTx
  >;
  readonly wormholeFromSolana: UseAsyncGeneratorResult<
    WithSplTokenAccounts<TransfersWithExistingTxs>,
    TxWithTokenId
  >;
}

export interface StepsReducer {
  readonly state: State;
  readonly startInteraction: (interactionSpec: InteractionSpec) => string;
  readonly resumeInteraction: () => Promise<void>;
  readonly retryInteraction: () => void;
  readonly mutations: StepMutations;
  readonly isInteractionInProgress: boolean;
}

// This effect handles updates during the CreatedSplTokenAccounts/CompletedPoolInteraction stages.
// The generator hook updates data with each result and it updates isSuccess once it is finished.
const useResumeInteractionOnDataOrSuccessEffect = <T>(
  isExternalConditionMet: boolean,
  isSuccess: boolean,
  data: T,
  resumeInteraction: () => any,
): void => {
  const isSuccessRef = useRef(isSuccess);
  const dataRef = useRef(data);

  useEffect((): void => {
    const shouldResume =
      isExternalConditionMet &&
      !isSuccessRef.current &&
      (isSuccess || data !== dataRef.current);

    // eslint-disable-next-line functional/immutable-data
    isSuccessRef.current = isSuccess;
    // eslint-disable-next-line functional/immutable-data
    dataRef.current = data;

    if (shouldResume) {
      resumeInteraction();
    }
  }, [isExternalConditionMet, isSuccess, data, resumeInteraction]);
};

const useRegisterErrorEffect = (
  isExternalConditionMet: boolean,
  error: Error | null,
  dispatch: Dispatch<Action>,
  refreshQueries: () => Promise<void>,
): void => {
  const errorRef = useRef(error);
  useEffect((): void => {
    if (error === errorRef.current) {
      return;
    }

    // eslint-disable-next-line functional/immutable-data
    errorRef.current = error;

    if (isExternalConditionMet && error) {
      const swimError = captureAndWrapException("", error);
      dispatch({
        type: ActionType.RegisterError,
        error: swimError,
      });
      void refreshQueries();
    }
  }, [isExternalConditionMet, error, dispatch, refreshQueries]);
};

export const useStepsReducer = (
  poolId: string,
  currentState: State = initialState,
): StepsReducer => {
  const { env } = useEnvironment();
  const config = useConfig();
  const wallets = useWallets();
  const { hasActiveInteraction, setActiveInteraction } =
    useActiveInteractionContext();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { lpToken, tokens, spec: poolSpec } = usePool(poolId);
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer<Reducer<State, Action>>(
    reducer(config),
    currentState,
  );

  const { address: solanaAddress } = wallets[EcosystemId.Solana];
  const isInteractionInProgress = isInProgress(state) || hasActiveInteraction;
  const statusRef = useRef(state.status);
  const errorRef = useRef(state.error);
  const signatureSetKeypairsRef = useRef(
    currentState.interaction?.signatureSetKeypairs ?? {},
  );

  if (currentState.interaction !== null) {
    const transactionName = InteractionType[currentState.interaction.type];
    Sentry.configureScope((scope) => scope.setTransactionName(transactionName));
  }

  // Set Sentry context
  Sentry.setTag("interactionId", currentState.interaction?.id ?? null);
  Sentry.setContext(
    "Interaction Params",
    Object.entries(currentState.interaction?.params ?? {}).reduce(
      (accumulator, [key, value]) => {
        const valueToSend =
          value instanceof Array ? JSON.stringify(value) : value;
        return {
          ...accumulator,
          [key]: valueToSend,
        };
      },
      {},
    ),
  );

  const createSplTokenAccountsMutation = useCreateSplTokenAccountsMutation();
  const wormholeToSolanaMutation = useTransferEvmTokensToSolanaGenerator();
  const doPoolOperationsMutation = usePoolOperationsGenerator();
  const wormholeFromSolanaMutation = useTransferSplTokensToEvmGenerator();

  const mutations = useMemo(
    () => ({
      createSplTokenAccounts: createSplTokenAccountsMutation,
      wormholeToSolana: wormholeToSolanaMutation,
      doPoolOperations: doPoolOperationsMutation,
      wormholeFromSolana: wormholeFromSolanaMutation,
    }),
    [
      createSplTokenAccountsMutation,
      wormholeToSolanaMutation,
      doPoolOperationsMutation,
      wormholeFromSolanaMutation,
    ],
  );

  const refreshQueries = useCallback(async (): Promise<void> => {
    const involvedEvmEcosystemIds = state.interaction
      ? Object.keys(state.interaction.connectedWallets)
          .map((ecosystemId) => ecosystemId as EcosystemId)
          .filter(isEvmEcosystemId)
      : [];

    await Promise.all([
      queryClient.invalidateQueries(["interactions"]),
      queryClient.invalidateQueries(["solanaTxs", env, solanaAddress]),
      queryClient.invalidateQueries(["solBalance", env, solanaAddress]),
      queryClient.invalidateQueries(["tokenAccounts", env, solanaAddress]),
      queryClient.invalidateQueries(["poolState", env, poolSpec.address]),
      queryClient.invalidateQueries(["liquidity", env]),
      ...involvedEvmEcosystemIds.flatMap((ecosystemId) => [
        queryClient.invalidateQueries(["evmTxs", env, ecosystemId]),
        queryClient.invalidateQueries(["erc20Balance", env, ecosystemId]),
        queryClient.invalidateQueries(["evmNativeBalance", env, ecosystemId]),
        queryClient.invalidateQueries(["evmTxFeesEstimate", env, ecosystemId]),
      ]),
    ]);
  }, [env, poolSpec.address, queryClient, solanaAddress, state.interaction]);

  const continueSteps = useCallback(async (): Promise<void> => {
    switch (state.status) {
      case Status.Initiated: {
        Object.values(mutations).forEach((mutation) => mutation.reset());
        const { mints } = state.steps.createSplTokenAccounts;
        // NOTE: SPL token accounts might have been created since we initiated the interaction
        if (mints.length > 0) {
          await queryClient.invalidateQueries([
            "tokenAccounts",
            env,
            solanaAddress,
          ]);
        }
        const createdTokenAccounts =
          await mutations.createSplTokenAccounts.mutateAsync(
            state.steps.createSplTokenAccounts.mints,
          );
        const combinedTokenAccounts = [
          ...splTokenAccounts,
          ...createdTokenAccounts,
        ];
        return dispatch({
          type: ActionType.CompleteCreateSplTokenAccounts,
          splTokenAccounts: combinedTokenAccounts,
          existingTransferToTxs: {},
        });
      }
      case Status.CreatedSplTokenAccounts: {
        const {
          data = [],
          isLoading,
          isSuccess,
          generate,
        } = mutations.wormholeToSolana;
        const { transfers, txs } = state.steps.wormholeToSolana;
        if (!isLoading && !isSuccess) {
          // NOTE: Errors are caught and set on the UseAsyncGeneratorResult
          void generate({
            transfers: combineTransfers(transfers),
            existingTxs: txs,
            splTokenAccounts: state.splTokenAccounts,
          });
          return;
        }

        const txsByTokenId = groupTxsByTokenId(data);
        return dispatch({
          type: ActionType.UpdateTransferToSolana,
          txs: txsByTokenId,
        });
      }
      case Status.TransferredToSolana: {
        await queryClient.invalidateQueries([
          "tokenAccounts",
          env,
          solanaAddress,
        ]);
        const {
          data: txs = [],
          isLoading,
          isSuccess,
          generate,
        } = mutations.doPoolOperations;
        const { interaction } = state;
        if (!isLoading && !isSuccess) {
          // NOTE: Errors are caught and set on the UseAsyncGeneratorResult
          void generate({
            ...interaction,
            splTokenAccounts,
          });
        }
        return dispatch({
          type: ActionType.UpdatePoolOperations,
          // TODO: Check we don't need to reuse previous txs
          operationTxs: txs,
          existingTransferFromTxs: state.steps.wormholeFromSolana.txs,
        });
      }
      case Status.CompletedPoolOperations: {
        const {
          data = [],
          isLoading,
          isSuccess,
          generate,
        } = mutations.wormholeFromSolana;
        const { transfers, txs } = state.steps.wormholeFromSolana;
        if (!isLoading && !isSuccess) {
          void generate({
            transfers: combineTransfers<Transfer>(transfers),
            existingTxs: txs,
            splTokenAccounts: state.splTokenAccounts,
          });
        }

        const txsByTokenId = groupTxsByTokenId(data);
        return dispatch({
          type: ActionType.UpdateTransferFromSolana,
          txs: txsByTokenId,
        });
      }
      case Status.Done: {
        setActiveInteraction(null);
        void refreshQueries();
        return;
      }
      default:
        return;
    }
  }, [
    env,
    solanaAddress,
    state,
    mutations,
    splTokenAccounts,
    queryClient,
    refreshQueries,
    setActiveInteraction,
  ]);

  const startInteraction = (interactionSpec: InteractionSpec): string => {
    const interactionId = generateId();
    const connectedWallets = getConnectedWallets(
      tokens,
      interactionSpec,
      wallets,
    );
    const signatureSetKeypairs = generateSignatureSetKeypairs(
      tokens,
      lpToken,
      interactionSpec,
      null,
    );
    const interaction: Interaction = {
      ...interactionSpec,
      id: interactionId,
      env,
      submittedAt: Date.now(),
      signatureSetKeypairs,
      previousSignatureSetAddresses:
        getSignatureSetAddresses(signatureSetKeypairs),
      connectedWallets,
    };
    const action: InitiateInteractionAction = {
      type: ActionType.InitiateInteraction,
      splTokenAccounts,
      config,
      interaction,
      txs: [],
    };
    storeInteraction(env, config, interaction, queryClient);
    dispatch(action);
    return interactionId;
  };

  const retryInteraction = useCallback(async (): Promise<void> => {
    setActiveInteraction(state.interaction?.id ?? null);
    await refreshQueries();
    const signatureSetKeypairs = state.interaction
      ? generateSignatureSetKeypairs(
          tokens,
          lpToken,
          state.interaction,
          state.steps.wormholeToSolana.transfers,
        )
      : {};
    dispatch({
      type: ActionType.ClearError,
      signatureSetKeypairs,
    });
  }, [
    state.interaction,
    state.steps,
    tokens,
    lpToken,
    dispatch,
    refreshQueries,
    setActiveInteraction,
  ]);

  const resumeInteraction = useCallback(async (): Promise<void> => {
    if (state.error) {
      return retryInteraction();
    }
    try {
      setActiveInteraction(state.interaction?.id ?? null);
      await continueSteps();
    } catch (error) {
      const swimError = captureAndWrapException("", error);
      dispatch({
        type: ActionType.RegisterError,
        error: swimError,
      });
    }
  }, [
    state.error,
    state.interaction,
    continueSteps,
    dispatch,
    retryInteraction,
    setActiveInteraction,
  ]);

  // Clear active interaction if an error is produced and resume interaction if the error is cleared
  useEffect((): void => {
    const shouldResume =
      !state.isFresh && state.error === null && errorRef.current !== null;
    const shouldClearActiveInteraction =
      state.error !== null && errorRef.current === null;
    // eslint-disable-next-line functional/immutable-data
    errorRef.current = state.error;

    if (shouldClearActiveInteraction) {
      setActiveInteraction(null);
    }
    if (shouldResume) {
      void resumeInteraction();
    }
  }, [state.isFresh, state.error, setActiveInteraction, resumeInteraction]);

  useEffect((): void => {
    if (state.status === statusRef.current) {
      return;
    }
    // eslint-disable-next-line functional/immutable-data
    statusRef.current = state.status;

    void resumeInteraction();
  }, [state.status, resumeInteraction]);

  useResumeInteractionOnDataOrSuccessEffect(
    statusRef.current === Status.CreatedSplTokenAccounts,
    mutations.wormholeToSolana.isSuccess,
    mutations.wormholeToSolana.data,
    resumeInteraction,
  );

  useResumeInteractionOnDataOrSuccessEffect(
    statusRef.current === Status.CompletedPoolOperations,
    mutations.wormholeFromSolana.isSuccess,
    mutations.wormholeFromSolana.data,
    resumeInteraction,
  );

  useRegisterErrorEffect(
    statusRef.current === Status.CreatedSplTokenAccounts,
    mutations.wormholeToSolana.error,
    dispatch,
    refreshQueries,
  );

  useRegisterErrorEffect(
    statusRef.current === Status.CompletedPoolOperations,
    mutations.wormholeFromSolana.error,
    dispatch,
    refreshQueries,
  );

  useEffect(() => {
    if (!state.interaction?.signatureSetKeypairs) {
      return;
    }
    const signatureSetKeypairsDidUpdate = Object.entries(
      state.interaction.signatureSetKeypairs,
    ).some(
      ([tokenId, keypair]) =>
        keypair?.publicKey.toBase58() !==
        signatureSetKeypairsRef.current[tokenId],
    );
    // eslint-disable-next-line functional/immutable-data
    signatureSetKeypairsRef.current = state.interaction.signatureSetKeypairs;
    if (signatureSetKeypairsDidUpdate) {
      storeInteraction(env, config, state.interaction, queryClient);
    }
  }, [env, config, queryClient, state.interaction]);

  return {
    state,
    startInteraction,
    resumeInteraction,
    retryInteraction,
    mutations,
    isInteractionInProgress,
  };
};
