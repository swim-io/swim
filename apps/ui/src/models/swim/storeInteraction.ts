import * as Sentry from "@sentry/react";
import type { QueryClient } from "react-query";

import type { Config, EcosystemId, Env, TokenSpec } from "../../config";
import { isValidEnv } from "../../config";
import { filterMap } from "../../utils";
import { Amount } from "../amount";

import { SwimDefiInstruction } from "./instructions";
import type {
  AddInteraction,
  Interaction,
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveUniformInteraction,
  SwapInteraction,
  SwimInteraction,
} from "./interaction";
import { getTokensByPool } from "./pool";

// Ideally we want this to be closer to 50 but we are limited by the number of concurrent
// calls to Etherscan/BscScan
const MAX_STORED_INTERACTIONS = 10;
/** Increase this every time we change the schema of stored interactions */
const VERSION = 1;

const getStorageKey = (env: Env): string => `interactions:${env}`;

export interface PreparedAddInteraction extends SwimInteraction {
  readonly instruction: SwimDefiInstruction.Add;
  readonly params: {
    readonly inputAmounts: readonly string[];
    readonly minimumMintAmount: string;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface PreparedSwapInteraction extends SwimInteraction {
  readonly instruction: SwimDefiInstruction.Swap;
  readonly params: {
    readonly exactInputAmounts: readonly string[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: string;
  };
}

export interface PreparedRemoveUniformInteraction extends SwimInteraction {
  readonly instruction: SwimDefiInstruction.RemoveUniform;
  readonly params: {
    readonly exactBurnAmount: string;
    readonly minimumOutputAmounts: readonly string[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactBurnInteraction extends SwimInteraction {
  readonly instruction: SwimDefiInstruction.RemoveExactBurn;
  readonly params: {
    readonly exactBurnAmount: string;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: string;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface PreparedRemoveExactOutputInteraction extends SwimInteraction {
  readonly instruction: SwimDefiInstruction.RemoveExactOutput;
  readonly params: {
    readonly maximumBurnAmount: string;
    readonly exactOutputAmounts: readonly string[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export type PreparedInteraction = {
  readonly version: number;
} & (
  | PreparedAddInteraction
  | PreparedSwapInteraction
  | PreparedRemoveUniformInteraction
  | PreparedRemoveExactBurnInteraction
  | PreparedRemoveExactOutputInteraction
);

const populateAddInteraction = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: PreparedAddInteraction,
): AddInteraction => {
  const { env } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...interaction.params,
      inputAmounts: interaction.params.inputAmounts.map((amount, i) =>
        Amount.fromHumanString(tokens[i], amount),
      ),
      minimumMintAmount: Amount.fromHumanString(
        lpToken,
        interaction.params.minimumMintAmount,
      ),
    },
  };
};

const populateSwapInteraction = (
  tokens: readonly TokenSpec[],
  interaction: PreparedSwapInteraction,
): SwapInteraction => {
  const { env } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...interaction.params,
      exactInputAmounts: interaction.params.exactInputAmounts.map((amount, i) =>
        Amount.fromHumanString(tokens[i], amount),
      ),
      minimumOutputAmount: Amount.fromHumanString(
        tokens[interaction.params.outputTokenIndex],
        interaction.params.minimumOutputAmount,
      ),
    },
  };
};

const populateRemoveUniformInteraction = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: PreparedRemoveUniformInteraction,
): RemoveUniformInteraction => {
  const { env } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...interaction.params,
      exactBurnAmount: Amount.fromHumanString(
        lpToken,
        interaction.params.exactBurnAmount,
      ),
      minimumOutputAmounts: interaction.params.minimumOutputAmounts.map(
        (amount, i) => Amount.fromHumanString(tokens[i], amount),
      ),
    },
  };
};

const populateRemoveExactBurnInteraction = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: PreparedRemoveExactBurnInteraction,
): RemoveExactBurnInteraction => {
  const { env } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...interaction.params,
      exactBurnAmount: Amount.fromHumanString(
        lpToken,
        interaction.params.exactBurnAmount,
      ),
      minimumOutputAmount: Amount.fromHumanString(
        tokens[interaction.params.outputTokenIndex],
        interaction.params.minimumOutputAmount,
      ),
    },
  };
};

const populateRemoveExactOutputInteraction = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: PreparedRemoveExactOutputInteraction,
): RemoveExactOutputInteraction => {
  const { env } = interaction;
  if (!isValidEnv(env)) {
    throw new Error("Invalid env");
  }
  return {
    ...interaction,
    env,
    params: {
      ...interaction.params,
      maximumBurnAmount: Amount.fromHumanString(
        lpToken,
        interaction.params.maximumBurnAmount,
      ),
      exactOutputAmounts: interaction.params.exactOutputAmounts.map(
        (amount, i) => Amount.fromHumanString(tokens[i], amount),
      ),
    },
  };
};

const populateInteraction = (
  tokens: readonly TokenSpec[],
  lpToken: TokenSpec,
  interaction: PreparedInteraction,
): Interaction => {
  switch (interaction.instruction) {
    case SwimDefiInstruction.Add:
      return populateAddInteraction(tokens, lpToken, interaction);
    case SwimDefiInstruction.Swap:
      return populateSwapInteraction(tokens, interaction);
    case SwimDefiInstruction.RemoveUniform:
      return populateRemoveUniformInteraction(tokens, lpToken, interaction);
    case SwimDefiInstruction.RemoveExactBurn:
      return populateRemoveExactBurnInteraction(tokens, lpToken, interaction);
    case SwimDefiInstruction.RemoveExactOutput:
      return populateRemoveExactOutputInteraction(tokens, lpToken, interaction);
    default:
      throw new Error("Interaction not recognized");
  }
};

const deserializeInteractions = (
  config: Config,
  serialized: string,
): readonly Interaction[] => {
  try {
    const tokensByPool = getTokensByPool(config);
    const parsed: readonly PreparedInteraction[] = JSON.parse(serialized);
    return filterMap(
      (interaction: PreparedInteraction) => interaction.version === VERSION,
      (interaction) => {
        const { lpToken, tokens } = tokensByPool[interaction.poolId];
        return populateInteraction(tokens, lpToken, interaction);
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

const serializeInteractions = (interactions: readonly Interaction[]): string =>
  JSON.stringify(
    interactions.map((interaction) => ({
      ...interaction,
      version: VERSION,
      // NOTE: We don’t store the private keys, we can regenerate new ones later
      signatureSetKeypairs: {},
    })),
  );

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
