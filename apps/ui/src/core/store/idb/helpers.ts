import Decimal from "decimal.js";

import type { EcosystemId, Env } from "../../../config";
import { findTokenById, isValidEnv } from "../../../config";
import type {
  AddInteraction,
  AddOperationSpec,
  FromSolanaTransferState,
  Interaction,
  InteractionState,
  InteractionStateV2,
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
  SwapInteractionSpecV2,
  SwapOperationSpec,
  ToSolanaTransferState,
} from "../../../models";
import { Amount, InteractionType, SwimDefiInstruction } from "../../../models";

interface PreparedAddInteraction extends Omit<AddInteraction, "params"> {
  readonly params: {
    readonly inputAmounts: readonly PreparedAmount[];
    readonly minimumMintAmount: PreparedAmount;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

interface PreparedRemoveUniformInteraction
  extends Omit<RemoveUniformInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: PreparedAmount;
    readonly minimumOutputAmounts: readonly PreparedAmount[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

interface PreparedRemoveExactBurnInteraction
  extends Omit<RemoveExactBurnInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: PreparedAmount;
    readonly minimumOutputAmount: PreparedAmount;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

interface PreparedRemoveExactOutputInteraction
  extends Omit<RemoveExactOutputInteraction, "params"> {
  readonly params: {
    readonly maximumBurnAmount: PreparedAmount;
    readonly exactOutputAmounts: readonly PreparedAmount[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

interface PreparedSwapInteraction extends Omit<SwapInteraction, "params"> {
  readonly params: {
    readonly exactInputAmount: PreparedAmount;
    readonly minimumOutputAmount: PreparedAmount;
  };
}

type PreparedInteraction =
  | PreparedAddInteraction
  | PreparedRemoveUniformInteraction
  | PreparedRemoveExactBurnInteraction
  | PreparedRemoveExactOutputInteraction
  | PreparedSwapInteraction;

interface PreparedAddOperationSpec extends Omit<AddOperationSpec, "params"> {
  readonly params: {
    readonly inputAmounts: readonly PreparedAmount[];
    readonly minimumMintAmount: PreparedAmount;
  };
}

interface PreparedRemoveUniformOperationSpec
  extends Omit<RemoveUniformOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: PreparedAmount;
    readonly minimumOutputAmounts: readonly PreparedAmount[];
  };
}

interface PreparedRemoveExactBurnOperationSpec
  extends Omit<RemoveExactBurnOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: PreparedAmount;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: PreparedAmount;
  };
}

interface PreparedRemoveExactOutputOperationSpec
  extends Omit<RemoveExactOutputOperationSpec, "params"> {
  readonly params: {
    readonly maximumBurnAmount: PreparedAmount;
    readonly exactOutputAmounts: readonly PreparedAmount[];
  };
}

interface PreparedSwapOperationSpec extends Omit<SwapOperationSpec, "params"> {
  readonly params: {
    readonly exactInputAmounts: readonly PreparedAmount[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: PreparedAmount;
  };
}

type PreparedOperationSpec =
  | PreparedAddOperationSpec
  | PreparedRemoveUniformOperationSpec
  | PreparedRemoveExactBurnOperationSpec
  | PreparedRemoveExactOutputOperationSpec
  | PreparedSwapOperationSpec;

interface PreparedSolanaPoolOperationState
  extends Omit<SolanaPoolOperationState, "operation"> {
  readonly operation: PreparedOperationSpec;
}

interface PersistedFromSolanaTransfer
  extends Omit<FromSolanaTransferState, "token" | "value"> {
  readonly token: {
    readonly id: string;
  };
  readonly value: string | null;
}

interface PersistedToSolanaTransfer
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

interface PreparedAmount {
  readonly tokenId: string;
  readonly value: string;
}

const fromAmountToPreparedAmount = (amount: Amount): PreparedAmount => ({
  tokenId: amount.tokenId,
  value: amount.toJSON(),
});

const fromPreparedAmountToAmount = (env: Env, preparedAmount: PreparedAmount) =>
  Amount.fromHumanString(
    findTokenById(preparedAmount.tokenId, env),
    preparedAmount.value,
  );

const populateAddInteraction = (
  interaction: PreparedAddInteraction,
): AddInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...params,
      inputAmounts: params.inputAmounts.map((preparedAmount) =>
        fromPreparedAmountToAmount(env, preparedAmount),
      ),
      minimumMintAmount: fromPreparedAmountToAmount(
        env,
        params.minimumMintAmount,
      ),
    },
  };
};

const populateRemoveUniformInteraction = (
  interaction: PreparedRemoveUniformInteraction,
): RemoveUniformInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...params,
      exactBurnAmount: fromPreparedAmountToAmount(env, params.exactBurnAmount),
      minimumOutputAmounts: params.minimumOutputAmounts.map((preparedAmount) =>
        fromPreparedAmountToAmount(env, preparedAmount),
      ),
    },
  };
};

const populateRemoveExactBurnInteraction = (
  interaction: PreparedRemoveExactBurnInteraction,
): RemoveExactBurnInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...params,
      exactBurnAmount: fromPreparedAmountToAmount(env, params.exactBurnAmount),
      minimumOutputAmount: fromPreparedAmountToAmount(
        env,
        params.minimumOutputAmount,
      ),
    },
  };
};

const populateRemoveExactOutputInteraction = (
  interaction: PreparedRemoveExactOutputInteraction,
): RemoveExactOutputInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...params,
      maximumBurnAmount: fromPreparedAmountToAmount(
        env,
        params.maximumBurnAmount,
      ),
      exactOutputAmounts: params.exactOutputAmounts.map((preparedAmount) =>
        fromPreparedAmountToAmount(env, preparedAmount),
      ),
    },
  };
};

// NOTE: This function operates just for 1 or 2 pools
// Should be aware if number of pool changes
const populateSwapInteraction = (
  interaction: PreparedSwapInteraction,
): SwapInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    params: {
      ...params,
      exactInputAmount: fromPreparedAmountToAmount(
        env,
        params.exactInputAmount,
      ),
      minimumOutputAmount: fromPreparedAmountToAmount(
        env,
        params.minimumOutputAmount,
      ),
    },
  };
};

const populateInteraction = (interaction: PreparedInteraction): Interaction => {
  switch (interaction.type) {
    case InteractionType.Add:
      return populateAddInteraction(interaction);
    case InteractionType.RemoveUniform:
      return populateRemoveUniformInteraction(interaction);
    case InteractionType.RemoveExactBurn:
      return populateRemoveExactBurnInteraction(interaction);
    case InteractionType.RemoveExactOutput:
      return populateRemoveExactOutputInteraction(interaction);
    case InteractionType.Swap:
      return populateSwapInteraction(interaction);
    default:
      throw new Error("Interaction not recognized");
  }
};

const populateSolanaPoolOperationState = (
  operationState: PreparedSolanaPoolOperationState,
  interaction: PreparedInteraction,
): SolanaPoolOperationState => {
  const { operation } = operationState;
  const { env } = interaction;

  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  switch (operation.instruction) {
    case SwimDefiInstruction.Add:
      return {
        ...operationState,
        operation: {
          ...operation,
          params: {
            ...operation.params,
            inputAmounts: operation.params.inputAmounts.map((preparedAmount) =>
              fromPreparedAmountToAmount(env, preparedAmount),
            ),
            minimumMintAmount: fromPreparedAmountToAmount(
              env,
              operation.params.minimumMintAmount,
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
            exactBurnAmount: fromPreparedAmountToAmount(
              env,
              operation.params.exactBurnAmount,
            ),
            minimumOutputAmounts: operation.params.minimumOutputAmounts.map(
              (preparedAmount) =>
                fromPreparedAmountToAmount(env, preparedAmount),
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
            minimumOutputAmount: fromPreparedAmountToAmount(
              env,
              operation.params.minimumOutputAmount,
            ),
            exactBurnAmount: fromPreparedAmountToAmount(
              env,
              operation.params.exactBurnAmount,
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
            maximumBurnAmount: fromPreparedAmountToAmount(
              env,
              operation.params.maximumBurnAmount,
            ),
            exactOutputAmounts: operation.params.exactOutputAmounts.map(
              (preparedAmount) =>
                fromPreparedAmountToAmount(env, preparedAmount),
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
            exactInputAmounts: operation.params.exactInputAmounts.map(
              (preparedAmount) =>
                fromPreparedAmountToAmount(env, preparedAmount),
            ),
            minimumOutputAmount: fromPreparedAmountToAmount(
              env,
              operation.params.minimumOutputAmount,
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
): InteractionState => ({
  interaction: populateInteraction(persistedState.interaction),
  requiredSplTokenAccounts: persistedState.requiredSplTokenAccounts,
  toSolanaTransfers: populateToSolanaTransferState(
    persistedState.toSolanaTransfers,
    persistedState.interaction.env,
  ),
  solanaPoolOperations: persistedState.solanaPoolOperations.map(
    (operation: PreparedSolanaPoolOperationState) =>
      populateSolanaPoolOperationState(operation, persistedState.interaction),
  ),
  fromSolanaTransfers: populateFromSolanaTransferState(
    persistedState.fromSolanaTransfers,
    persistedState.interaction.env,
  ),
});

const prepareInteraction = (interaction: Interaction): PreparedInteraction => {
  switch (interaction.type) {
    case InteractionType.Add:
      return {
        ...interaction,
        params: {
          ...interaction.params,
          inputAmounts: interaction.params.inputAmounts.map(
            fromAmountToPreparedAmount,
          ),
          minimumMintAmount: fromAmountToPreparedAmount(
            interaction.params.minimumMintAmount,
          ),
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...interaction,
        params: {
          ...interaction.params,
          exactBurnAmount: fromAmountToPreparedAmount(
            interaction.params.exactBurnAmount,
          ),
          minimumOutputAmounts: interaction.params.minimumOutputAmounts.map(
            fromAmountToPreparedAmount,
          ),
        },
      };
    case InteractionType.RemoveExactBurn:
      return {
        ...interaction,
        params: {
          ...interaction.params,
          exactBurnAmount: fromAmountToPreparedAmount(
            interaction.params.exactBurnAmount,
          ),
          minimumOutputAmount: fromAmountToPreparedAmount(
            interaction.params.minimumOutputAmount,
          ),
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...interaction,
        params: {
          ...interaction.params,
          maximumBurnAmount: fromAmountToPreparedAmount(
            interaction.params.maximumBurnAmount,
          ),
          exactOutputAmounts: interaction.params.exactOutputAmounts.map(
            fromAmountToPreparedAmount,
          ),
        },
      };
    case InteractionType.Swap:
      return {
        ...interaction,
        params: {
          ...interaction.params,
          exactInputAmount: fromAmountToPreparedAmount(
            interaction.params.exactInputAmount,
          ),
          minimumOutputAmount: fromAmountToPreparedAmount(
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
          inputAmounts: operation.params.inputAmounts.map(
            fromAmountToPreparedAmount,
          ),
          minimumMintAmount: fromAmountToPreparedAmount(
            operation.params.minimumMintAmount,
          ),
        },
      };
    case SwimDefiInstruction.RemoveUniform:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactBurnAmount: fromAmountToPreparedAmount(
            operation.params.exactBurnAmount,
          ),
          minimumOutputAmounts: operation.params.minimumOutputAmounts.map(
            fromAmountToPreparedAmount,
          ),
        },
      };
    case SwimDefiInstruction.RemoveExactBurn:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactBurnAmount: fromAmountToPreparedAmount(
            operation.params.exactBurnAmount,
          ),
          minimumOutputAmount: fromAmountToPreparedAmount(
            operation.params.minimumOutputAmount,
          ),
        },
      };
    case SwimDefiInstruction.RemoveExactOutput:
      return {
        ...operation,
        params: {
          ...operation.params,
          maximumBurnAmount: fromAmountToPreparedAmount(
            operation.params.maximumBurnAmount,
          ),
          exactOutputAmounts: operation.params.exactOutputAmounts.map(
            fromAmountToPreparedAmount,
          ),
        },
      };
    case SwimDefiInstruction.Swap:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactInputAmounts: operation.params.exactInputAmounts.map(
            fromAmountToPreparedAmount,
          ),
          minimumOutputAmount: fromAmountToPreparedAmount(
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

export type PreparedInteractionV2 =
  | PreparedAddInteraction
  | PreparedRemoveUniformInteraction
  | PreparedRemoveExactBurnInteraction
  | PreparedRemoveExactOutputInteraction
  | SwapInteractionSpecV2;

export interface PersistedInteractionStateV2
  extends Omit<InteractionStateV2, "interaction"> {
  readonly interaction: PreparedInteractionV2;
}

// export const prepareInteractionState = (
//   interactionState: InteractionState,
// ): PersistedInteractionState => ({
//   ...interactionState,
//   fromSolanaTransfers: interactionState.fromSolanaTransfers.map((transfer) => ({
//     ...transfer,
//     token: { id: transfer.token.id },
//     value:
//       transfer.value instanceof Decimal
//         ? transfer.value.toJSON()
//         : transfer.value,
//   })),
//   toSolanaTransfers: interactionState.toSolanaTransfers.map((transfer) => ({
//     ...transfer,
//     token: { id: transfer.token.id },
//     value:
//       transfer.value instanceof Decimal
//         ? transfer.value.toJSON()
//         : transfer.value,
//   })),
//   interaction: prepareInteraction(interactionState.interaction),
//   solanaPoolOperations: interactionState.solanaPoolOperations.map((state) => ({
//     ...state,
//     operation: prepareSolanaPoolOperation(state.operation),
//   })),
// });
