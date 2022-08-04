import type { EcosystemId, EvmEcosystemId } from "../config";
import { isEvmEcosystemId } from "../config";
;

import type { Amount } from "./amount";

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
