import * as Sentry from "@sentry/react";
import type { QueryClient } from "react-query";

import type {
  Config,
  EcosystemId,
  Env,
  PoolSpec,
  TokenSpec,
} from "../../config";
import { isValidEnv } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { filterMap, findOrThrow } from "../../utils";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type {
  AddInteraction,
  Interaction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
  WithOperations,
} from "./interaction";
import { InteractionType } from "./interaction";
import type {
  AddOperationSpec,
  OperationSpec,
  RemoveExactBurnOperationSpec,
  RemoveExactOutputOperationSpec,
  RemoveUniformOperationSpec,
  SwapOperationSpec,
} from "./operation";
import type { TokensByPoolId } from "./pool";
import { getTokensByPool } from "./pool";

// Ideally we want this to be closer to 50 but we are limited by the number of concurrent
// calls to Etherscan/BscScan
const MAX_STORED_INTERACTIONS = 10;
/** Increase this every time we change the schema of stored interactions */
const VERSION = 2;

const getStorageKey = (env: Env): string => `interactions:${env}`;

export interface PreparedAddOperationSpec
  extends Omit<AddOperationSpec, "params"> {
  readonly params: {
    readonly inputAmounts: readonly string[];
    readonly minimumMintAmount: string;
  };
}

export interface PreparedRemoveUniformOperationSpec
  extends Omit<RemoveUniformOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly minimumOutputAmounts: readonly string[];
  };
}

export interface PreparedRemoveExactBurnOperationSpec
  extends Omit<RemoveExactBurnOperationSpec, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: string;
  };
}

export interface PreparedRemoveExactOutputOperationSpec
  extends Omit<RemoveExactOutputOperationSpec, "params"> {
  readonly params: {
    readonly maximumBurnAmount: string;
    readonly exactOutputAmounts: readonly string[];
  };
}

export interface PreparedSwapOperationSpec
  extends Omit<SwapOperationSpec, "params"> {
  readonly params: {
    readonly exactInputAmounts: readonly string[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: string;
  };
}

export type PreparedOperationSpec =
  | PreparedAddOperationSpec
  | PreparedRemoveUniformOperationSpec
  | PreparedRemoveExactBurnOperationSpec
  | PreparedRemoveExactOutputOperationSpec
  | PreparedSwapOperationSpec;

type WithPreparedOperations<T> = T & {
  readonly operations: readonly PreparedOperationSpec[];
};

export interface PreparedAddInteraction
  extends Omit<WithPreparedOperations<AddInteraction>, "params"> {
  readonly params: {
    readonly inputAmounts: ReadonlyRecord<string, string>;
    readonly minimumMintAmount: string;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface PreparedRemoveUniformInteraction
  extends Omit<WithPreparedOperations<RemoveUniformInteraction>, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly minimumOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactBurnInteraction
  extends Omit<WithPreparedOperations<RemoveExactBurnInteraction>, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: string;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactOutputInteraction
  extends Omit<WithPreparedOperations<RemoveExactOutputInteraction>, "params"> {
  readonly params: {
    readonly maximumBurnAmount: string;
    readonly exactOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedSwapInteraction
  extends Omit<WithPreparedOperations<SwapInteraction>, "params"> {
  readonly params: {
    readonly exactInputAmounts: ReadonlyRecord<string, string>;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: string;
  };
}

export type PreparedInteraction = {
  readonly version: number;
} & (
  | PreparedAddInteraction
  | PreparedRemoveUniformInteraction
  | PreparedRemoveExactBurnInteraction
  | PreparedRemoveExactOutputInteraction
  | PreparedSwapInteraction
);

const prepareOperation = (operation: OperationSpec): PreparedOperationSpec => {
  switch (operation.instruction) {
    case SwimDefiInstruction.Add: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          inputAmounts: params.inputAmounts.map((amount) => amount.toJSON()),
          minimumMintAmount: params.minimumMintAmount.toJSON(),
        },
      };
    }
    case SwimDefiInstruction.RemoveUniform: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactBurnAmount: params.exactBurnAmount.toJSON(),
          minimumOutputAmounts: params.minimumOutputAmounts.map((amount) =>
            amount.toJSON(),
          ),
        },
      };
    }
    case SwimDefiInstruction.RemoveExactBurn: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactBurnAmount: params.exactBurnAmount.toJSON(),
          minimumOutputAmount: params.minimumOutputAmount.toJSON(),
        },
      };
    }
    case SwimDefiInstruction.RemoveExactOutput: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          maximumBurnAmount: params.maximumBurnAmount.toJSON(),
          exactOutputAmounts: params.exactOutputAmounts.map((amount) =>
            amount.toJSON(),
          ),
        },
      };
    }
    case SwimDefiInstruction.Swap: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactInputAmounts: params.exactInputAmounts.map((amount) =>
            amount.toJSON(),
          ),
          minimumOutputAmount: params.minimumOutputAmount.toJSON(),
        },
      };
    }
    default:
      throw new Error("Unknown instruction");
  }
};

const populateOperation = (
  {
    lpToken,
    tokens,
  }: { readonly lpToken: TokenSpec; readonly tokens: readonly TokenSpec[] },
  operation: PreparedOperationSpec,
): OperationSpec => {
  switch (operation.instruction) {
    case SwimDefiInstruction.Add: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          inputAmounts: params.inputAmounts.map((amount, i) =>
            Amount.fromHumanString(tokens[i], amount),
          ),
          minimumMintAmount: Amount.fromHumanString(
            lpToken,
            params.minimumMintAmount,
          ),
        },
      };
    }
    case SwimDefiInstruction.RemoveUniform: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactBurnAmount: Amount.fromHumanString(
            lpToken,
            params.exactBurnAmount,
          ),
          minimumOutputAmounts: params.minimumOutputAmounts.map((amount, i) =>
            Amount.fromHumanString(tokens[i], amount),
          ),
        },
      };
    }
    case SwimDefiInstruction.RemoveExactBurn: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactBurnAmount: Amount.fromHumanString(
            lpToken,
            params.exactBurnAmount,
          ),
          minimumOutputAmount: Amount.fromHumanString(
            tokens[params.outputTokenIndex],
            params.minimumOutputAmount,
          ),
        },
      };
    }
    case SwimDefiInstruction.RemoveExactOutput: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          maximumBurnAmount: Amount.fromHumanString(
            lpToken,
            params.maximumBurnAmount,
          ),
          exactOutputAmounts: params.exactOutputAmounts.map((amount, i) =>
            Amount.fromHumanString(tokens[i], amount),
          ),
        },
      };
    }
    case SwimDefiInstruction.Swap: {
      const { params } = operation;
      return {
        ...operation,
        params: {
          ...params,
          exactInputAmounts: params.exactInputAmounts.map((amount, i) =>
            Amount.fromHumanString(tokens[i], amount),
          ),
          minimumOutputAmount: Amount.fromHumanString(
            tokens[params.outputTokenIndex],
            params.minimumOutputAmount,
          ),
        },
      };
    }
    default:
      throw new Error("Unknown instruction");
  }
};

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

const populateAddInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedAddInteraction,
): WithOperations<AddInteraction> => {
  const { env, operations, params } = interaction;
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
    operations: operations.map(populateOperation.bind(null, poolTokens)),
    params: {
      ...params,
      inputAmounts: tokenAmountsRecordToMap(
        poolTokens.tokens,
        params.inputAmounts,
      ),
      minimumMintAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.minimumMintAmount,
      ),
    },
  };
};

const populateRemoveUniformInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedRemoveUniformInteraction,
): WithOperations<RemoveUniformInteraction> => {
  const { env, operations, params } = interaction;
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
    operations: operations.map(populateOperation.bind(null, poolTokens)),
    params: {
      ...params,
      exactBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.exactBurnAmount,
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
): WithOperations<RemoveExactBurnInteraction> => {
  const { env, operations, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  if (poolSpecs.length !== 1) {
    throw new Error("Invalid interaction");
  }
  const poolTokens = tokensByPoolId[interaction.poolId];
  const outputToken = findOrThrow(
    poolTokens.tokens,
    ({ id }) => id === params.outputTokenId,
  );
  return {
    ...interaction,
    env,
    operations: operations.map(populateOperation.bind(null, poolTokens)),
    params: {
      ...params,
      exactBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.exactBurnAmount,
      ),
      minimumOutputAmount: Amount.fromHumanString(
        outputToken,
        params.minimumOutputAmount,
      ),
    },
  };
};

const populateRemoveExactOutputInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedRemoveExactOutputInteraction,
): WithOperations<RemoveExactOutputInteraction> => {
  const { env, operations, params } = interaction;
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
    operations: operations.map(populateOperation.bind(null, poolTokens)),
    params: {
      ...params,
      maximumBurnAmount: Amount.fromHumanString(
        poolTokens.lpToken,
        params.maximumBurnAmount,
      ),
      exactOutputAmounts: tokenAmountsRecordToMap(
        poolTokens.tokens,
        params.exactOutputAmounts,
      ),
    },
  };
};

const populateSwapInteraction = (
  tokensByPoolId: TokensByPoolId,
  interaction: PreparedSwapInteraction,
): WithOperations<SwapInteraction> => {
  const { env, operations, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  const inputPoolTokens = tokensByPoolId[interaction.poolIds[0]];
  const outputPoolTokens =
    tokensByPoolId[interaction.poolIds[interaction.poolIds.length - 1]];
  const outputToken = findOrThrow(
    outputPoolTokens.tokens,
    ({ id }) => id === params.outputTokenId,
  );
  return {
    ...interaction,
    env,
    operations: operations.map((operation, i) =>
      // TODO: Make this more robust
      populateOperation(
        i === 1 ? outputPoolTokens : inputPoolTokens,
        operation,
      ),
    ),
    params: {
      ...params,
      exactInputAmounts: tokenAmountsRecordToMap(
        inputPoolTokens.tokens,
        params.exactInputAmounts,
      ),
      minimumOutputAmount: Amount.fromHumanString(
        outputToken,
        params.minimumOutputAmount,
      ),
    },
  };
};

const populateInteraction = (
  tokensByPoolId: TokensByPoolId,
  poolSpecs: readonly PoolSpec[],
  interaction: PreparedInteraction,
): WithOperations<Interaction> => {
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

const deserializeInteractions = (
  config: Config,
  serialized: string,
): readonly WithOperations<Interaction>[] => {
  const tokensByPoolId = getTokensByPool(config);
  try {
    const parsed: readonly PreparedInteraction[] = JSON.parse(serialized);
    return filterMap(
      (interaction: PreparedInteraction) => interaction.version === VERSION,
      (interaction) => {
        const poolSpecs = interaction.poolIds.map((poolId) =>
          findOrThrow(config.pools, (pool) => pool.id === poolId),
        );
        return populateInteraction(tokensByPoolId, poolSpecs, interaction);
      },
      parsed,
    );
  } catch (err) {
    Sentry.captureException(err);
    return [];
  }
};

export const loadInteractions = (
  env: Env,
  config: Config,
): readonly WithOperations<Interaction>[] =>
  deserializeInteractions(
    config,
    localStorage.getItem(getStorageKey(env)) ?? "[]",
  );

const prepareInteraction = (
  interaction: WithOperations<Interaction>,
): PreparedInteraction => {
  const base = {
    version: VERSION,
    // NOTE: We don’t store the private keys, we can regenerate new ones later
    signatureSetKeypairs: {},
  };
  switch (interaction.type) {
    case InteractionType.Add:
      return {
        ...interaction,
        ...base,
        operations: interaction.operations.map(prepareOperation),
        params: {
          ...interaction.params,
          inputAmounts: tokenAmountsMapToRecord(
            interaction.params.inputAmounts,
          ),
          minimumMintAmount: interaction.params.minimumMintAmount.toJSON(),
        },
      };
    case InteractionType.RemoveUniform:
      return {
        ...interaction,
        ...base,
        operations: interaction.operations.map(prepareOperation),
        params: {
          ...interaction.params,
          exactBurnAmount: interaction.params.exactBurnAmount.toJSON(),
          minimumOutputAmounts: tokenAmountsMapToRecord(
            interaction.params.minimumOutputAmounts,
          ),
        },
      };
    case InteractionType.RemoveExactBurn:
      return {
        ...interaction,
        ...base,
        operations: interaction.operations.map(prepareOperation),
        params: {
          ...interaction.params,
          exactBurnAmount: interaction.params.exactBurnAmount.toJSON(),
          minimumOutputAmount: interaction.params.minimumOutputAmount.toJSON(),
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...interaction,
        ...base,
        operations: interaction.operations.map(prepareOperation),
        params: {
          ...interaction.params,
          maximumBurnAmount: interaction.params.maximumBurnAmount.toJSON(),
          exactOutputAmounts: tokenAmountsMapToRecord(
            interaction.params.exactOutputAmounts,
          ),
        },
      };
    case InteractionType.Swap:
      return {
        ...interaction,
        ...base,
        operations: interaction.operations.map(prepareOperation),
        params: {
          ...interaction.params,
          exactInputAmounts: tokenAmountsMapToRecord(
            interaction.params.exactInputAmounts,
          ),
          minimumOutputAmount: interaction.params.minimumOutputAmount.toJSON(),
        },
      };
    default:
      throw new Error("Unknown interaction type");
  }
};

const serializeInteractions = (
  interactions: readonly WithOperations<Interaction>[],
): string => JSON.stringify(interactions.map(prepareInteraction));

const updateOrPrependInteraction = (
  existingInteractions: readonly WithOperations<Interaction>[],
  interaction: WithOperations<Interaction>,
): readonly WithOperations<Interaction>[] => {
  const existingIndex = existingInteractions.findIndex(
    ({ id }) => id === interaction.id,
  );
  return existingIndex === -1
    ? [interaction, ...existingInteractions]
    : [
        ...existingInteractions.slice(0, existingIndex),
        interaction,
        ...existingInteractions.slice(existingIndex + 1),
      ];
};

export const storeInteraction = (
  env: Env,
  config: Config,
  interaction: WithOperations<Interaction>,
  queryClient: QueryClient,
): void => {
  const existingInteractions = loadInteractions(env, config);
  const updatedInteractions = updateOrPrependInteraction(
    existingInteractions,
    interaction,
  );
  const serialized = serializeInteractions(
    updatedInteractions.slice(0, MAX_STORED_INTERACTIONS),
  );
  try {
    localStorage.setItem(getStorageKey(env), serialized);
    void queryClient.invalidateQueries(["interactions"]);
  } catch (err) {
    Sentry.captureException(err);
  }
};
