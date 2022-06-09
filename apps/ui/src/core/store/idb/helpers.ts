import Decimal from "decimal.js";

import type { EcosystemId, Env } from "../../../config";
import { findTokenById, isValidEnv } from "../../../config";
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
} from "../../../models";
import { Amount, InteractionType, SwimDefiInstruction } from "../../../models";

export interface PreparedAddInteraction extends Omit<AddInteraction, "params"> {
  readonly params: {
    readonly inputAmounts: readonly TokenDB[];
    readonly minimumMintAmount: TokenDB;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface PreparedRemoveUniformInteraction
  extends Omit<RemoveUniformInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: TokenDB;
    readonly minimumOutputAmounts: readonly TokenDB[];
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
    readonly exactOutputAmounts: readonly TokenDB[];
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

const fromTokenDBToAmount = (env: Env, tokenDB: TokenDB) =>
  Amount.fromHumanString(findTokenById(tokenDB.tokenId, env), tokenDB.value);

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
      inputAmounts: params.inputAmounts.map((tokenDB) =>
        fromTokenDBToAmount(env, tokenDB),
      ),
      minimumMintAmount: fromTokenDBToAmount(env, params.minimumMintAmount),
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
      exactBurnAmount: fromTokenDBToAmount(env, params.exactBurnAmount),
      minimumOutputAmounts: params.minimumOutputAmounts.map((tokenDB) =>
        fromTokenDBToAmount(env, tokenDB),
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
      exactBurnAmount: fromTokenDBToAmount(env, params.exactBurnAmount),
      minimumOutputAmount: fromTokenDBToAmount(env, params.minimumOutputAmount),
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
      maximumBurnAmount: fromTokenDBToAmount(env, params.maximumBurnAmount),
      exactOutputAmounts: params.exactOutputAmounts.map((tokenDB) =>
        fromTokenDBToAmount(env, tokenDB),
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
      exactInputAmount: fromTokenDBToAmount(env, params.exactInputAmount),
      minimumOutputAmount: fromTokenDBToAmount(env, params.minimumOutputAmount),
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
            inputAmounts: operation.params.inputAmounts.map((tokenDB) =>
              fromTokenDBToAmount(env, tokenDB),
            ),
            minimumMintAmount: fromTokenDBToAmount(
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
            exactBurnAmount: fromTokenDBToAmount(
              env,
              operation.params.exactBurnAmount,
            ),
            minimumOutputAmounts: operation.params.minimumOutputAmounts.map(
              (tokenDB) => fromTokenDBToAmount(env, tokenDB),
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
            minimumOutputAmount: fromTokenDBToAmount(
              env,
              operation.params.minimumOutputAmount,
            ),
            exactBurnAmount: fromTokenDBToAmount(
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
            maximumBurnAmount: fromTokenDBToAmount(
              env,
              operation.params.maximumBurnAmount,
            ),
            exactOutputAmounts: operation.params.exactOutputAmounts.map(
              (tokenDB) => fromTokenDBToAmount(env, tokenDB),
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
              (tokenDB) => fromTokenDBToAmount(env, tokenDB),
            ),
            minimumOutputAmount: fromTokenDBToAmount(
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
          inputAmounts:
            interaction.params.inputAmounts.map(fromAmountToTokenDB),
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
          minimumOutputAmounts:
            interaction.params.minimumOutputAmounts.map(fromAmountToTokenDB),
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
          exactOutputAmounts:
            interaction.params.exactOutputAmounts.map(fromAmountToTokenDB),
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
          inputAmounts: operation.params.inputAmounts.map(fromAmountToTokenDB),
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
          minimumOutputAmounts:
            operation.params.minimumOutputAmounts.map(fromAmountToTokenDB),
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
          exactOutputAmounts:
            operation.params.exactOutputAmounts.map(fromAmountToTokenDB),
        },
      };
    case SwimDefiInstruction.Swap:
      return {
        ...operation,
        params: {
          ...operation.params,
          exactInputAmounts:
            operation.params.exactInputAmounts.map(fromAmountToTokenDB),
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
