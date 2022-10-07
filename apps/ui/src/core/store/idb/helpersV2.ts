import type { Env } from "@swim-io/core/types";
import Decimal from "decimal.js";
import type {
  InteractionStateV2,
  InteractionV2,
  TokenTransferData,
} from "models";

import type { EcosystemId } from "../../../config";
import { findTokenById } from "../../../config";
import { Amount } from "../../../models";

import type {
  PersistedInteractionStateV2,
  PreparedInteractionV2,
} from "./helpers";

type Serializer<T, V> = (data: unknown | T) => V | undefined;
type Deserializer<T, V> = (env: Env, data: unknown | T) => V | undefined;

interface SerializedAmount {
  readonly value: string;
  readonly tokenId: string;
}

const serializeAmount: Serializer<Amount, SerializedAmount> = (
  amount: unknown | Amount,
): SerializedAmount | undefined =>
  amount instanceof Amount
    ? {
        value: amount.toHumanString(amount.tokenConfig.nativeEcosystemId),
        tokenId: amount.tokenConfig.id,
      }
    : undefined;

const isSerializedAmount = (data: unknown): data is SerializedAmount =>
  typeof data === "object" &&
  data !== null &&
  "value" in data &&
  "tokenId" in data;
const deserializeAmount: Deserializer<SerializedAmount, Amount> = (
  env: Env,
  data: unknown,
) =>
  isSerializedAmount(data)
    ? Amount.fromHumanString(findTokenById(data.tokenId, env), data.value)
    : undefined;

interface SerializedTokenTransferData {
  readonly tokenId: string;
  readonly ecosystemId: EcosystemId;
  readonly value: string;
}

const isTokenTransferData = (data: unknown): data is TokenTransferData =>
  typeof data === "object" &&
  data !== null &&
  "tokenConfig" in data &&
  "ecosystemId" in data &&
  "value" in data;
const serializeTokenTransferData: Serializer<
  TokenTransferData,
  SerializedTokenTransferData
> = (data: unknown): SerializedTokenTransferData | undefined =>
  isTokenTransferData(data)
    ? {
        tokenId: data.tokenConfig.id,
        value: data.value.toString(),
        ecosystemId: data.ecosystemId,
      }
    : undefined;

const isSerializedTokenTransferData = (
  data: unknown,
): data is SerializedTokenTransferData =>
  typeof data === "object" &&
  data !== null &&
  "tokenId" in data &&
  "ecosystemId" in data &&
  "value" in data;
const deserializeTokenTransferData: Deserializer<
  SerializedTokenTransferData,
  TokenTransferData
> = (env: Env, data: unknown): TokenTransferData | undefined =>
  isSerializedTokenTransferData(data)
    ? {
        tokenConfig: findTokenById(data.tokenId, env),
        value: new Decimal(data.value),
        ecosystemId: data.ecosystemId,
      }
    : undefined;

const serializeDecimal: Serializer<Decimal | null, string> = (
  decimal: unknown | Decimal,
): string | undefined =>
  decimal instanceof Decimal ? decimal.toString() : undefined;

const deserializeDecimal: Deserializer<string, Decimal | null> = (
  _env: Env,
  data: unknown,
) => (typeof data === "string" ? new Decimal(data) : null);

const paramParsers = [
  {
    fieldNames: new Set(["fromTokenData", "toTokenData"]),
    serialize: serializeTokenTransferData,
    deserialize: deserializeTokenTransferData,
  },
  {
    fieldNames: new Set([
      "inputAmounts",
      "minimumMintAmount",
      "exactBurnAmount",
      "minimumOutputAmounts",
      "minimumOutputAmount",
      "maximumBurnAmount",
      "exactOutputAmounts",
    ]),
    serialize: serializeAmount,
    deserialize: deserializeAmount,
  },
  {
    fieldNames: new Set(["firstMinimumOutputAmount"]),
    serialize: serializeDecimal,
    deserialize: deserializeDecimal,
  },
];

const serializeInteractionV2 = (
  interaction: InteractionV2,
): PreparedInteractionV2 => {
  const params = Object.entries(interaction.params).reduce(
    (result, [key, value]) => {
      const serialize = paramParsers.find(({ fieldNames }) =>
        fieldNames.has(key),
      )?.serialize;
      if (!serialize) {
        throw new Error(`Parser not found for ${key}`);
      }
      return {
        ...result,
        [key]: Array.isArray(value)
          ? value.map((v) => serialize(v))
          : serialize(value),
      };
    },
    {},
  );
  return {
    ...interaction,
    params,
  };
};

export const serializeInteractionStateV2 = (
  interactionState: InteractionStateV2,
): PersistedInteractionStateV2 => {
  return {
    ...interactionState,
    interaction: serializeInteractionV2(interactionState.interaction),
  };
};

const deserializeInteractionV2 = (
  interaction: PreparedInteractionV2,
): InteractionV2 => {
  const params = Object.entries(interaction.params).reduce(
    (result, [key, value]) => {
      const deserialize = paramParsers.find(({ fieldNames }) =>
        fieldNames.has(key),
      )?.deserialize;
      if (!deserialize) {
        throw new Error(`Deparser not found for ${key}`);
      }
      const { env } = interaction;
      return {
        ...result,
        [key]: Array.isArray(value)
          ? value.map((item) => deserialize(env, item))
          : deserialize(env, value),
      };
    },
    {},
  );
  return {
    ...interaction,
    params,
  } as InteractionV2;
};

export const deserializeInteractionStateV2 = (
  interactionState: PersistedInteractionStateV2,
): InteractionStateV2 => {
  return {
    ...interactionState,
    interaction: deserializeInteractionV2(interactionState.interaction),
  } as InteractionStateV2;
};
