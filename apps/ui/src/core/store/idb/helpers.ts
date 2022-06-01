import * as Sentry from "@sentry/react";
import Decimal from "decimal.js";

import type {
  Config,
  EcosystemId,
  Env,
  PoolSpec,
  TokenDB,
  TokenSpec,
} from "../../../config";
import { findTokenById, isValidEnv } from "../../../config";
import type {
  AddInteraction,
  FromSolanaTransferState,
  Interaction,
  InteractionState,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  SwapInteraction,
  ToSolanaTransferState,
  TokensByPoolId,
} from "../../../models";
import { Amount, InteractionType, getTokensByPool } from "../../../models";
import type { ReadonlyRecord } from "../../../utils";
import { findOrThrow } from "../../../utils";

export interface PreparedAddInteraction extends Omit<AddInteraction, "params"> {
  readonly params: {
    readonly inputAmounts: ReadonlyRecord<string, string>;
    readonly minimumMintAmount: TokenDB;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface PreparedRemoveUniformInteraction
  extends Omit<RemoveUniformInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: TokenDB;
    readonly minimumOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactBurnInteraction
  extends Omit<RemoveExactBurnInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: TokenDB;
    readonly minimumOutputAmount: TokenDB;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactOutputInteraction
  extends Omit<RemoveExactOutputInteraction, "params"> {
  readonly params: {
    readonly maximumBurnAmount: TokenDB;
    readonly exactOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedSwapInteraction
  extends Omit<SwapInteraction, "params"> {
  readonly params: {
    readonly exactInputAmount: TokenDB;
    readonly minimumOutputAmount: TokenDB;
  };
}

export type PreparedInteraction =
  | PreparedAddInteraction
  | PreparedRemoveUniformInteraction
  | PreparedRemoveExactBurnInteraction
  | PreparedRemoveExactOutputInteraction
  | PreparedSwapInteraction;

export interface PeristedFromSolanaTransfers
  extends Omit<FromSolanaTransferState, "token" | "value"> {
  readonly token: {
    readonly id: string;
  };
  readonly value: string | null;
}

export interface PeristedToSolanaTransfers
  extends Omit<ToSolanaTransferState, "token" | "value"> {
  readonly token: {
    readonly id: string;
  };
  readonly value: string;
}

export type PersistedInteractionState = {
  readonly fromSolanaTransfers: readonly PeristedFromSolanaTransfers[];
  readonly toSolanaTransfers: readonly PeristedToSolanaTransfers[];
  readonly interaction: PreparedInteraction;
  readonly solanaPoolOperations: readonly SolanaPoolOperationState[];
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
};

type PersistedTransfers = readonly (PeristedFromSolanaTransfers &
  PeristedToSolanaTransfers)[];

const tokenAmountsRecordToMap = (
  tokens: readonly TokenSpec[],
  amounts: ReadonlyRecord<string, string>,
): ReadonlyMap<string, Amount> =>
  Object.entries(amounts).reduce((map, [tokenId, stringAmount]) => {
    const token = findOrThrow(tokens, ({ id }) => id === tokenId);
    const amount = Amount.fromHumanString(token, stringAmount);
    return map.set(tokenId, amount);
  }, new Map());

const tokenAmountsMapToRecord = (
  amounts: ReadonlyMap<string, Amount>,
): ReadonlyRecord<string, string> =>
  [...amounts.entries()].reduce(
    (record, [tokenId, amount]) => ({
      ...record,
      [tokenId]: amount.toJSON(),
    }),
    {},
  );

const tokenAmountArrayToRecord = (
  amounts: readonly Amount[],
): ReadonlyRecord<string, string> =>
  [...amounts].reduce(
    (record, amount) => ({
      ...record,
      [amount.tokenId]: amount.toJSON(),
    }),
    {},
  );

const tokenAmountRecordToArray = (
  tokens: readonly TokenSpec[],
  amounts: ReadonlyRecord<string, string>,
): readonly Amount[] =>
  Object.entries(amounts).map(([tokenId, stringAmount]) => {
    const token = findOrThrow(tokens, ({ id }) => id === tokenId);
    return Amount.fromHumanString(token, stringAmount);
  });

const populateAddInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedAddInteraction,
): AddInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[interaction.poolId];
  return {
    ...interaction,
    env,
    params: {
      ...params,
      inputAmounts: tokenAmountsRecordToMap(
        poolTokens.tokens,
        params.inputAmounts,
      ),
      minimumMintAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.minimumMintAmount.value,
      ),
    },
  };
};

const populateRemoveUniformInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedRemoveUniformInteraction,
): RemoveUniformInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[interaction.poolId];
  return {
    ...interaction,
    env,
    params: {
      ...params,
      exactBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.exactBurnAmount.value,
      ),
      minimumOutputAmounts: tokenAmountsRecordToMap(
        poolTokens.tokens,
        params.minimumOutputAmounts,
      ),
    },
  };
};

const populateRemoveExactBurnInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedRemoveExactBurnInteraction,
): RemoveExactBurnInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[interaction.poolId];

  return {
    ...interaction,
    env,
    params: {
      ...params,
      exactBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.exactBurnAmount.value,
      ),
      minimumOutputAmount: Amount.fromHumanString(
        findTokenById(params.minimumOutputAmount.tokenId, interaction.env),
        params.minimumOutputAmount.value,
      ),
    },
  };
};

const populateRemoveExactOutputInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedRemoveExactOutputInteraction,
): RemoveExactOutputInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[interaction.poolId];
  return {
    ...interaction,
    env,
    params: {
      ...params,
      maximumBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.maximumBurnAmount.value,
      ),
      exactOutputAmounts: tokenAmountsRecordToMap(
        poolTokens.tokens,
        params.exactOutputAmounts,
      ),
    },
  };
};

// NOTE: This function operates just for 1 or 2 pools
// Should be aware if number of pool changes
const populateSwapInteraction = (
  tokensByPoolId: TokensByPoolId,
  interaction: PreparedSwapInteraction,
): SwapInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  const inputPoolTokens = tokensByPoolId[interaction.poolIds[0]];
  const inputToken = findOrThrow(
    inputPoolTokens.tokens,
    ({ id }) => id === params.exactInputAmount.tokenId,
  );
  const outputPoolTokens =
    tokensByPoolId[interaction.poolIds[interaction.poolIds.length - 1]];
  const outputToken = findOrThrow(
    outputPoolTokens.tokens,
    ({ id }) => id === params.minimumOutputAmount.tokenId,
  );
  return {
    ...interaction,
    params: {
      ...params,
      exactInputAmount: Amount.fromHumanString(
        inputToken,
        params.exactInputAmount.value,
      ),
      minimumOutputAmount: Amount.fromHumanString(
        outputToken,
        params.minimumOutputAmount.value,
      ),
    },
  };
};

const populateInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedInteraction,
): Interaction => {
  switch (interaction.type) {
    case InteractionType.Add:
      return populateAddInteraction(tokensByPoolId, poolSpecs, interaction);
    case InteractionType.RemoveUniform:
      return populateRemoveUniformInteraction(
        tokensByPoolId,
        poolSpecs,
        interaction,
      );
    case InteractionType.RemoveExactBurn:
      return populateRemoveExactBurnInteraction(
        tokensByPoolId,
        poolSpecs,
        interaction,
      );
    case InteractionType.RemoveExactOutput:
      return populateRemoveExactOutputInteraction(
        tokensByPoolId,
        poolSpecs,
        interaction,
      );
    case InteractionType.Swap:
      return populateSwapInteraction(tokensByPoolId, interaction);
    default:
      throw new Error("Interaction not recognized");
  }
};

const populateSolanaPoolOperationState = (
  operationState: SolanaPoolOperationState,
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedInteraction,
): SolanaPoolOperationState => {
  const { params }: any = operationState.operation;
  const { env } = interaction;

  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[operationState.operation.poolId];

  switch (interaction.type) {
    case InteractionType.Add:
      return {
        ...operationState,
        operation: {
          ...operationState.operation,
          params: {
            ...params,
            inputAmounts: tokenAmountRecordToArray(
              poolTokens.tokens,
              params.inputAmounts,
            ),
            minimumMintAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              params.minimumMintAmount.value,
            ),
          },
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...operationState,
        operation: {
          ...operationState.operation,
          params: {
            ...params,
            exactBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              params.exactBurnAmount.value,
            ),
            minimumOutputAmounts: tokenAmountRecordToArray(
              poolTokens.tokens,
              params.minimumOutputAmounts,
            ),
          },
        },
      };
    case InteractionType.RemoveExactBurn:
      return {
        ...operationState,
        operation: {
          ...operationState.operation,
          params: {
            ...params,
            minimumOutputAmounts: Amount.fromHumanString(
              poolTokens.tokens[params.outputTokenIndex],
              params.minimumOutputAmounts.value,
            ),
            exactBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              params.exactBurnAmount,
            ),
          },
        },
      };

    case InteractionType.RemoveExactOutput:
      return {
        ...operationState,
        operation: {
          ...operationState.operation,
          params: {
            ...params,
            maximumBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              params.maximumBurnAmount.value,
            ),
            exactOutputAmounts: tokenAmountRecordToArray(
              poolTokens.tokens,
              params.exactOutputAmounts,
            ),
          },
        },
      };

    case InteractionType.Swap:
      return {
        ...operationState,
        operation: {
          ...operationState.operation,
          params: {
            ...params,
            exactInputAmounts: tokenAmountRecordToArray(
              poolTokens.tokens,
              params.exactInputAmounts,
            ),
            minimumOutputAmount: Amount.fromHumanString(
              poolTokens.tokens[params.outputTokenIndex],
              params.minimumOutputAmount.value,
            ),
          },
        },
      };

    default:
      throw new Error("Interaction not recognized");
  }
};

const populateTransfers = (
  parsedTransfers: PersistedTransfers,
  env: Env,
): readonly (ToSolanaTransferState & FromSolanaTransferState)[] =>
  parsedTransfers.map((transfer) => ({
    ...transfer,
    token: findTokenById(transfer.token.id, env),
    value: new Decimal(parseInt(transfer.value || "0")),
  }));

export const deserializeInteractionStates = (
  persistedStates: readonly PersistedInteractionState[],
  env: Env,
  config: Config,
): readonly InteractionState[] => {
  const tokensByPoolId = getTokensByPool(config);
  try {
    const deserializedInteractionState = persistedStates.map((state: any) => {
      const poolSpecs: readonly PoolSpec[] = state.interaction.poolIds.map(
        (poolId: string) =>
          findOrThrow(config.pools, (pool) => pool.id === poolId),
      );

      const populatedState: InteractionState = {
        toSolanaTransfers: populateTransfers(state.toSolanaTransfers, env),
        interaction: populateInteraction(
          tokensByPoolId,
          poolSpecs,
          state.interaction,
        ),
        fromSolanaTransfers: populateTransfers(state.fromSolanaTransfers, env),
        solanaPoolOperations: state.solanaPoolOperations.map(
          (operation: SolanaPoolOperationState) =>
            populateSolanaPoolOperationState(
              operation,
              tokensByPoolId,
              poolSpecs,
              state.interaction,
            ),
        ),
        requiredSplTokenAccounts: state.requiredSplTokenAccounts,
      };
      return populatedState;
    });
    return deserializedInteractionState;
  } catch (err) {
    Sentry.captureException(err);
    return [];
  }
};

export const prepareInteraction = (
  interaction: Interaction,
): PreparedInteraction => {
  const base = {
    signatureSetKeypairs: {},
  };
  switch (interaction.type) {
    case InteractionType.Add:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          inputAmounts: tokenAmountsMapToRecord(
            interaction.params.inputAmounts,
          ),
          minimumMintAmount: interaction.params.minimumMintAmount.toDBToken(),
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          exactBurnAmount: interaction.params.exactBurnAmount.toDBToken(),
          minimumOutputAmounts: tokenAmountsMapToRecord(
            interaction.params.minimumOutputAmounts,
          ),
        },
      };
    case InteractionType.RemoveExactBurn:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          exactBurnAmount: interaction.params.exactBurnAmount.toDBToken(),
          minimumOutputAmount:
            interaction.params.minimumOutputAmount.toDBToken(),
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          maximumBurnAmount: interaction.params.maximumBurnAmount.toDBToken(),
          exactOutputAmounts: tokenAmountsMapToRecord(
            interaction.params.exactOutputAmounts,
          ),
        },
      };
    case InteractionType.Swap:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          exactInputAmount: interaction.params.exactInputAmount.toDBToken(),
          minimumOutputAmount:
            interaction.params.minimumOutputAmount.toDBToken(),
        },
      };
    default:
      throw new Error("Unknown interaction type");
  }
};

const prepareSolanaPoolOperations = (
  solanaPoolOperations: SolanaPoolOperationState,
  interactionType: InteractionType,
): SolanaPoolOperationState => {
  const { params }: any = solanaPoolOperations.operation;
  switch (interactionType) {
    case InteractionType.Add:
      return {
        ...solanaPoolOperations,
        operation: {
          ...solanaPoolOperations.operation,
          params: {
            ...params,
            inputAmounts: tokenAmountArrayToRecord(params.inputAmounts),
            minimumMintAmount: params.minimumMintAmount.toDBToken(),
          },
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...solanaPoolOperations,
        operation: {
          ...solanaPoolOperations.operation,
          params: {
            ...params,
            exactBurnAmount: params.exactBurnAmount.toDBToken(),
            minimumOutputAmounts: tokenAmountArrayToRecord(
              params.minimumOutputAmounts,
            ),
          },
        },
      };
    case InteractionType.RemoveExactBurn:
      return {
        ...solanaPoolOperations,
        operation: {
          ...solanaPoolOperations.operation,
          params: {
            ...params,
            exactBurnAmount: params.exactBurnAmount.toDBToken(),
            minimumOutputAmount: params.minimumOutputAmount.toDBToken(),
          },
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...solanaPoolOperations,
        operation: {
          ...solanaPoolOperations.operation,
          params: {
            ...params,
            maximumBurnAmount: params.maximumBurnAmount.toDBToken(),
            exactOutputAmounts: tokenAmountArrayToRecord(
              params.exactOutputAmounts,
            ),
          },
        },
      };
    case InteractionType.Swap:
      return {
        ...solanaPoolOperations,
        operation: {
          ...solanaPoolOperations.operation,
          params: {
            ...params,
            exactInputAmounts: tokenAmountArrayToRecord(
              params.exactInputAmounts,
            ),
            minimumOutputAmount: params.minimumOutputAmount.toDBToken(),
          },
        },
      };
    default:
      throw new Error("Unknown interaction type");
  }
};

export const prepareInteractionState = (
  interactionState: InteractionState,
): PersistedInteractionState => ({
  ...interactionState,
  fromSolanaTransfers: interactionState.fromSolanaTransfers.map((transfer) => ({
    ...transfer,
    token: { id: transfer.token.id },
    value:
      transfer.value instanceof Decimal
        ? transfer.value.toJSON()
        : transfer.value,
  })),
  toSolanaTransfers: interactionState.toSolanaTransfers.map((transfer) => ({
    ...transfer,
    token: { id: transfer.token.id },
    value:
      transfer.value instanceof Decimal
        ? transfer.value.toJSON()
        : transfer.value,
  })),
  interaction: prepareInteraction(interactionState.interaction),
  solanaPoolOperations: interactionState.solanaPoolOperations.map(
    (solanaOperation) =>
      prepareSolanaPoolOperations(
        solanaOperation,
        interactionState.interaction.type,
      ),
  ),
});
