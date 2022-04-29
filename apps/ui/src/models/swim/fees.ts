import Decimal from "decimal.js";

import type { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { getRecordKeys } from "../../utils";

export type FeesEstimation = ReadonlyRecord<EcosystemId, Decimal>;

// NOTE: These are a little higher than the maximum gas requirements seen so far but we should keep an eye out for higher values
export const APPROVAL_CEILING = 70000;
export const TRANSFER_CEILING = 120000;
export const REDEEM_CEILING = 300000;
export const SOLANA_FEE = new Decimal(0.01);

export const getLowBalanceWallets = (
  feesEstimation: FeesEstimation | null,
  userNativeBalances: ReadonlyRecord<EcosystemId, Decimal>,
): readonly EcosystemId[] => {
  if (feesEstimation === null) {
    return [];
  }
  return getRecordKeys(feesEstimation).filter((ecosystemId) =>
    userNativeBalances[ecosystemId].lessThan(feesEstimation[ecosystemId]),
  );
};
