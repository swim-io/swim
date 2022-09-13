import Decimal from "decimal.js";

import type { EcosystemId, TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";

export const atomicStringToHumanDecimal = (
  atomicString: string,
  tokenConfig: TokenConfig,
  ecosystemId: EcosystemId,
): Decimal => {
  const details = getTokenDetailsForEcosystem(tokenConfig, ecosystemId);
  if (!details) {
    throw new Error(
      `No token details for ecosystem ${ecosystemId} and token ${tokenConfig.id}`,
    );
  }
  return new Decimal(atomicString).div(10 ** details.decimals);
};

export const humanDecimalToAtomicString = (
  decimal: Decimal,
  tokenConfig: TokenConfig,
  ecosystemId: EcosystemId,
): string => {
  const details = getTokenDetailsForEcosystem(tokenConfig, ecosystemId);
  if (!details) {
    throw new Error(
      `No token details for ecosystem ${ecosystemId} and token ${tokenConfig.id}`,
    );
  }
  return decimal.mul(10 ** details.decimals).toFixed(0);
};
