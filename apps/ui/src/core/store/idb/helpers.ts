import Decimal from "decimal.js";

import type { EcosystemId, Env, TokenSpec } from "../../../config";
import { configs, findTokenById, isValidEnv } from "../../../config";
import type {
  AddInteraction,
  AddOperationSpec,
  FromSolanaTransferState,
  Interaction,
  InteractionState,
  OperationSpec,
  RemoveExactBurnInteraction,
  RemoveExactBurnOperationSpec,
  RemoveExactOutputInteraction,
  RemoveExactOutputOperationSpec,
  RemoveUniformInteraction,
  RemoveUniformOperationSpec,
  RequiredSplTokenAccounts,
  SolanaPoolOperationState,
  SwapInteraction,
  SwapOperationSpec,
  ToSolanaTransferState,
  TokensByPoolId,
} from "../../../models";
import {
  Amount,
  InteractionType,
  SwimDefiInstruction,
  getTokensByPool,
} from "../../../models";
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

export interface PreparedAddOperationSpec
  extends Omit<AddOperationSpec, "params"> {
  readonly params: {
    readonly inputAmounts: readonly TokenDB[];
    readonly minimumMintAmount: TokenDB;
  };
}

export interface PreparedRemoveUniformOperationSpec
  extends Omit<RemoveUniformOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: TokenDB;
    readonly minimumOutputAmounts: readonly TokenDB[];
  };
}

export interface PreparedRemoveExactBurnOperationSpec
  extends Omit<RemoveExactBurnOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: TokenDB;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: TokenDB;
  };
}

export interface PreparedRemoveExactOutputOperationSpec
  extends Omit<RemoveExactOutputOperationSpec, "params"> {
  readonly params: {
    readonly maximumBurnAmount: TokenDB;
    readonly exactOutputAmounts: readonly TokenDB[];
  };
}

export interface PreparedSwapOperationSpec
  extends Omit<SwapOperationSpec, "params"> {
  readonly params: {
    readonly exactInputAmounts: readonly TokenDB[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: TokenDB;
  };
}

export type PreparedOperationSpec =
  | PreparedAddOperationSpec
  | PreparedRemoveUniformOperationSpec
  | PreparedRemoveExactBurnOperationSpec
  | PreparedRemoveExactOutputOperationSpec
  | PreparedSwapOperationSpec;

export interface PreparedSolanaPoolOperationState
  extends Omit<SolanaPoolOperationState, "operation"> {
  readonly operation: PreparedOperationSpec;
}

export interface PersistedFromSolanaTransfer
  extends Omit<FromSolanaTransferState, "token" | "value"> {
  readonly token: {
    readonly id: string;
  };
  readonly value: string | null;
}

export interface PersistedToSolanaTransfer
  extends Omit<ToSolanaTransferState, "token" | "value"> {
  readonly token: {
    readonly id: string;
  };
  readonly value: string;
}

export type PersistedInteractionState = {
  readonly fromSolanaTransfers: readonly PersistedFromSolanaTransfer[];
  readonly toSolanaTransfers: readonly PersistedToSolanaTransfer[];
  readonly interaction: PreparedInteraction;
  readonly solanaPoolOperations: readonly PreparedSolanaPoolOperationState[];
  readonly requiredSplTokenAccounts: RequiredSplTokenAccounts;
};
export interface TokenDB {
  readonly tokenId: string;
  readonly value: string;
}

const fromAmountToTokenDB = (amount: Amount): TokenDB => ({
  tokenId: amount.tokenId,
  value: amount.toJSON(),
});

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
const tokenAmountArrayToRecordArray = (
  amounts: readonly Amount[],
): readonly TokenDB[] =>
  [...amounts].map((amount) => fromAmountToTokenDB(amount));

const tokenRecordArrayToAmountArray = (
  tokens: readonly TokenSpec[],
  amounts: readonly TokenDB[],
): readonly Amount[] =>
  [...amounts].map(({ tokenId, value }) => {
    const tokenSpec = findOrThrow(tokens, ({ id }) => id === tokenId);
    return Amount.fromHumanString(tokenSpec, value);
  });

const populateAddInteraction = (
  tokensByPoolId: TokensByPoolId,
  interaction: PreparedAddInteraction,
): AddInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
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
  interaction: PreparedRemoveUniformInteraction,
): RemoveUniformInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
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
  interaction: PreparedRemoveExactBurnInteraction,
): RemoveExactBurnInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
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
  interaction: PreparedRemoveExactOutputInteraction,
): RemoveExactOutputInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
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
  interaction: PreparedInteraction,
): Interaction => {
  switch (interaction.type) {
    case InteractionType.Add:
      return populateAddInteraction(tokensByPoolId, interaction);
    case InteractionType.RemoveUniform:
      return populateRemoveUniformInteraction(tokensByPoolId, interaction);
    case InteractionType.RemoveExactBurn:
      return populateRemoveExactBurnInteraction(tokensByPoolId, interaction);
    case InteractionType.RemoveExactOutput:
      return populateRemoveExactOutputInteraction(tokensByPoolId, interaction);
    case InteractionType.Swap:
      return populateSwapInteraction(tokensByPoolId, interaction);
    default:
      throw new Error("Interaction not recognized");
  }
};

const populateSolanaPoolOperationState = (
  operationState: PreparedSolanaPoolOperationState,
  tokensByPoolId: TokensByPoolId,
  interaction: PreparedInteraction,
): SolanaPoolOperationState => {
  const { operation } = operationState;
  const { env } = interaction;

  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  const poolTokens = tokensByPoolId[operationState.operation.poolId];

  switch (operation.instruction) {
    case SwimDefiInstruction.Add:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            inputAmounts: tokenRecordArrayToAmountArray(
              poolTokens.tokens,
              operation.params.inputAmounts,
            ),
            minimumMintAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              operation.params.minimumMintAmount.value,
            ),
          },
        },
      };
    case SwimDefiInstruction.RemoveUniform:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            exactBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              operation.params.exactBurnAmount.value,
            ),
            minimumOutputAmounts: tokenRecordArrayToAmountArray(
              poolTokens.tokens,
              operation.params.minimumOutputAmounts,
            ),
          },
        },
      };
    case SwimDefiInstruction.RemoveExactBurn:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            minimumOutputAmount: Amount.fromHumanString(
              poolTokens.tokens[operation.params.outputTokenIndex],
              operation.params.minimumOutputAmount.value,
            ),
            exactBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              operation.params.exactBurnAmount.value,
            ),
          },
        },
      };

    case SwimDefiInstruction.RemoveExactOutput:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            maximumBurnAmount: Amount.fromHumanString(
              poolTokens.lpToken,
              operation.params.maximumBurnAmount.value,
            ),
            exactOutputAmounts: tokenRecordArrayToAmountArray(
              poolTokens.tokens,
              operation.params.exactOutputAmounts,
            ),
          },
        },
      };
    case SwimDefiInstruction.Swap:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            exactInputAmounts: tokenRecordArrayToAmountArray(
              poolTokens.tokens,
              operation.params.exactInputAmounts,
            ),
            minimumOutputAmount: Amount.fromHumanString(
              poolTokens.tokens[operation.params.outputTokenIndex],
              operation.params.minimumOutputAmount.value,
            ),
          },
        },
      };

    default:
      throw new Error("Interaction not recognized");
  }
};

const populateToSolanaTransferState = (
  parsedTransfers: readonly PersistedToSolanaTransfer[],
  env: Env,
): readonly ToSolanaTransferState[] =>
  parsedTransfers.map((transfer: PersistedToSolanaTransfer) => ({
    ...transfer,
    token: findTokenById(transfer.token.id, env),
    value: new Decimal(parseInt(transfer.value)),
  }));

const populateFromSolanaTransferState = (
  parsedTransfers: readonly PersistedFromSolanaTransfer[],
  env: Env,
): readonly FromSolanaTransferState[] =>
  parsedTransfers.map((transfer: PersistedFromSolanaTransfer) => ({
    ...transfer,
    token: findTokenById(transfer.token.id, env),
    value: transfer.value ? new Decimal(parseInt(transfer.value)) : null,
  }));

export const deserializeInteractionState = (
  persistedState: PersistedInteractionState,
): InteractionState => {
  const config = configs[persistedState.interaction.env];
  const tokensByPoolId = getTokensByPool(config);

  const populatedState: InteractionState = {
    toSolanaTransfers: populateToSolanaTransferState(
      persistedState.toSolanaTransfers,
      persistedState.interaction.env,
    ),
    interaction: populateInteraction(
      tokensByPoolId,
      persistedState.interaction,
    ),
    fromSolanaTransfers: populateFromSolanaTransferState(
      persistedState.fromSolanaTransfers,
      persistedState.interaction.env,
    ),
    solanaPoolOperations: persistedState.solanaPoolOperations.map(
      (operation: PreparedSolanaPoolOperationState) =>
        populateSolanaPoolOperationState(
          operation,
          tokensByPoolId,
          persistedState.interaction,
        ),
    ),
    requiredSplTokenAccounts: persistedState.requiredSplTokenAccounts,
  };
  return populatedState;
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
          minimumMintAmount: fromAmountToTokenDB(
            interaction.params.minimumMintAmount,
          ),
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          exactBurnAmount: fromAmountToTokenDB(
            interaction.params.exactBurnAmount,
          ),
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
          exactBurnAmount: fromAmountToTokenDB(
            interaction.params.exactBurnAmount,
          ),
          minimumOutputAmount: fromAmountToTokenDB(
            interaction.params.minimumOutputAmount,
          ),
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...interaction,
        ...base,
        params: {
          ...interaction.params,
          maximumBurnAmount: fromAmountToTokenDB(
            interaction.params.maximumBurnAmount,
          ),
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
          exactInputAmount: fromAmountToTokenDB(
            interaction.params.exactInputAmount,
          ),
          minimumOutputAmount: fromAmountToTokenDB(
            interaction.params.minimumOutputAmount,
          ),
        },
      };
    default:
      throw new Error("Unknown interaction type");
  }
};

const prepareSolanaPoolOperation = (
  operation: OperationSpec,
): PreparedOperationSpec => {
  switch (operation.instruction) {
    case SwimDefiInstruction.Add:
      return {
        ...operation,
        params: {
          ...operation.params,
          inputAmounts: tokenAmountArrayToRecordArray(
            operation.params.inputAmounts,
          ),
          minimumMintAmount: fromAmountToTokenDB(
            operation.params.minimumMintAmount,
          ),
        },
      };
    case SwimDefiInstruction.RemoveUniform:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactBurnAmount: fromAmountToTokenDB(
            operation.params.exactBurnAmount,
          ),
          minimumOutputAmounts: tokenAmountArrayToRecordArray(
            operation.params.minimumOutputAmounts,
          ),
        },
      };
    case SwimDefiInstruction.RemoveExactBurn:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactBurnAmount: fromAmountToTokenDB(
            operation.params.exactBurnAmount,
          ),
          minimumOutputAmount: fromAmountToTokenDB(
            operation.params.minimumOutputAmount,
          ),
        },
      };
    case SwimDefiInstruction.RemoveExactOutput:
      return {
        ...operation,
        params: {
          ...operation.params,
          maximumBurnAmount: fromAmountToTokenDB(
            operation.params.maximumBurnAmount,
          ),
          exactOutputAmounts: tokenAmountArrayToRecordArray(
            operation.params.exactOutputAmounts,
          ),
        },
      };
    case SwimDefiInstruction.Swap:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactInputAmounts: tokenAmountArrayToRecordArray(
            operation.params.exactInputAmounts,
          ),
          minimumOutputAmount: fromAmountToTokenDB(
            operation.params.minimumOutputAmount,
          ),
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
  solanaPoolOperations: interactionState.solanaPoolOperations.map((state) => ({
    ...state,
    operation: prepareSolanaPoolOperation(state.operation),
  })),
});
