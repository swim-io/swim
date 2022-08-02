import { sleep } from "@swim-io/utils";

import type { EcosystemId, EvmEcosystemId } from "../config";
import { isEvmEcosystemId } from "../config";
import { SwimError } from "../errors";

import type { Amount } from "./amount";

// const DEFAULT_MAX_RETRIES = 10;
const DEFAULT_SLEEP_MS = 1000;

export const INTERACTION_ID_LENGTH = 16;
export const INTERACTION_ID_LENGTH_HEX = INTERACTION_ID_LENGTH * 2;

export const generateId = (length = INTERACTION_ID_LENGTH): string => {
  const idBytes = crypto.getRandomValues(new Uint8Array(length));
  return Buffer.from(idBytes).toString("hex");
};

export const countNonZeroAmounts = (
  amounts: readonly (Amount | null)[],
  ecosystemId: EcosystemId,
): number =>
  amounts.filter(
    (amount) =>
      amount &&
      amount.tokenSpec.nativeEcosystemId === ecosystemId &&
      !amount.isZero(),
  ).length;

export const getIncludedEvmEcosystemIds = (
  amounts: readonly (Amount | null)[],
): readonly EvmEcosystemId[] =>
  amounts
    .filter((amount): amount is Amount => amount !== null && !amount.isZero())
    .map((amount) => amount.tokenSpec.nativeEcosystemId)
    .filter(isEvmEcosystemId);

// TODO needs some cleaning;
export const callWithRetry = async <T>(
  fn: () => Promise<T>,
  fn2: () => void,
  maxRetries,
  sleepy = DEFAULT_SLEEP_MS,
): Promise<T> => {
  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    try {
      return await fn();
    } catch (error: unknown) {
      if (attempts >= maxRetries) {
        throw error;
      } else if (error instanceof Error && error.name === "NetworkError") {
        // this.incrementRpcProvider();
        fn2();
      } else {
        await sleep(sleepy);
      }
    }
  }
  // NOTE: This check is only here for type safety and should never happen
  throw new SwimError("callWithRetry Error");
};
