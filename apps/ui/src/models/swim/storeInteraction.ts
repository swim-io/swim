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

import type {
  AddInteraction,
  Interaction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
} from "./interaction";
import { InteractionType } from "./interaction";
import type { TokensByPoolId } from "./pool";
import { getTokensByPool } from "./pool";

// Ideally we want this to be closer to 50 but we are limited by the number of concurrent
// calls to Etherscan/BscScan
const MAX_STORED_INTERACTIONS = 10;
/** Increase this every time we change the schema of stored interactions */
const VERSION = 2;

const getStorageKey = (env: Env): string => `interactions:${env}`;

export interface PreparedAddInteraction extends Omit<AddInteraction, "params"> {
  readonly params: {
    readonly inputAmounts: ReadonlyRecord<string, string>;
    readonly minimumMintAmount: string;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface PreparedRemoveUniformInteraction
  extends Omit<RemoveUniformInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly minimumOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactBurnInteraction
  extends Omit<RemoveExactBurnInteraction, "params"> {
  readonly params: {
    readonly exactBurnAmount: string;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: string;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactOutputInteraction
  extends Omit<RemoveExactOutputInteraction, "params"> {
  readonly params: {
    readonly maximumBurnAmount: string;
    readonly exactOutputAmounts: ReadonlyRecord<string, string>;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedSwapInteraction
  extends Omit<SwapInteraction, "params"> {
  readonly params: {
    readonly inputTokenId: string;
    readonly exactInputAmount: string;
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
        params.minimumMintAmount,
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
): RemoveExactBurnInteraction => {
  const { env, params } = interaction;
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
): SwapInteraction => {
  const { env, params } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  const inputPoolTokens = tokensByPoolId[interaction.poolIds[0]];
  const inputToken = findOrThrow(
    inputPoolTokens.tokens,
    ({ id }) => id === params.inputTokenId,
  );
  const outputPoolTokens =
    tokensByPoolId[interaction.poolIds[interaction.poolIds.length - 1]];
  const outputToken = findOrThrow(
    outputPoolTokens.tokens,
    ({ id }) => id === params.outputTokenId,
  );
  return {
    ...interaction,
    env,
    params: {
      ...params,
      exactInputAmount: Amount.fromHumanString(
        inputToken,
        params.exactInputAmount,
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

const deserializeInteractions = (
  config: Config,
  serialized: string,
): readonly Interaction[] => {
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
): readonly Interaction[] =>
  deserializeInteractions(
    config,
    localStorage.getItem(getStorageKey(env)) ?? "[]",
  );

const prepareInteraction = (interaction: Interaction): PreparedInteraction => {
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
        params: {
          ...interaction.params,
          exactBurnAmount: interaction.params.exactBurnAmount.toJSON(),
          outputTokenId: interaction.params.minimumOutputAmount.tokenId,
          minimumOutputAmount: interaction.params.minimumOutputAmount.toJSON(),
        },
      };
    case InteractionType.RemoveExactOutput:
      return {
        ...interaction,
        ...base,
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
        params: {
          ...interaction.params,
          inputTokenId: interaction.params.exactInputAmount.tokenId,
          exactInputAmount: interaction.params.exactInputAmount.toJSON(),
          outputTokenId: interaction.params.minimumOutputAmount.tokenId,
          minimumOutputAmount: interaction.params.minimumOutputAmount.toJSON(),
        },
      };
    default:
      throw new Error("Unknown interaction type");
  }
};

const serializeInteractions = (interactions: readonly Interaction[]): string =>
  JSON.stringify(interactions.map(prepareInteraction));

const updateOrPrependInteraction = (
  existingInteractions: readonly Interaction[],
  interaction: Interaction,
): readonly Interaction[] => {
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
  interaction: Interaction,
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
