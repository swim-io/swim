import Decimal from "decimal.js";

import type { EcosystemId, TokenSpec } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";

export const atomicStringToHumanDecimal = (
  atomicString: string,
  tokenSpec: TokenSpec,
  ecosystemId: EcosystemId,
): Decimal => {
  const details = getTokenDetailsForEcosystem(tokenSpec, ecosystemId);
  if (!details) {
    throw new Error(
      `No token details for ecosystem ${ecosystemId} and token '${tokenSpec.id}'`,
    );
  }
  return new Decimal(atomicString).div(10 ** details.decimals);
};

export const humanDecimalToAtomicString = (
  decimal: Decimal,
  tokenSpec: TokenSpec,
  ecosystemId: EcosystemId,
): string => {
  const details = getTokenDetailsForEcosystem(tokenSpec, ecosystemId);
  if (!details) {
    throw new Error(
      `No token details for ecosystem ${ecosystemId} and token '${tokenSpec.id}'`,
    );
  }
  return decimal.mul(10 ** details.decimals).toFixed(0);
};
