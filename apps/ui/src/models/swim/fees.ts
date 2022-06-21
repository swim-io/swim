import Decimal from "decimal.js";

import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { getRecordKeys } from "../../utils";

export type FeesEstimation = ReadonlyRecord<EcosystemId, Decimal>;

// NOTE: These are a little higher than the maximum gas requirements seen so far but we should keep an eye out for higher values
export const APPROVAL_CEILING = 70000;
export const TRANSFER_CEILING = 120000;
export const REDEEM_CEILING = 300000;
export const SOLANA_FEE = new Decimal(0.01);
const POLYGON_EXISTENTIAL_DEPOSIT_AMOUNT = 1;

export const getLowBalanceWallets = (
  feesEstimation: FeesEstimation | null,
  userNativeBalances: ReadonlyRecord<EcosystemId, Decimal>,
): readonly EcosystemId[] => {
  if (feesEstimation === null) {
    return [];
  }
  return getRecordKeys(feesEstimation).filter((ecosystemId) => {
    if (
      [EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId) &&
      userNativeBalances[ecosystemId].lessThan(
        POLYGON_EXISTENTIAL_DEPOSIT_AMOUNT,
      )
    ) {
      // If a Polygon chain has a low native balance, their TX may fail the
      // existential deposit requirement (account gets labeled as inactive).
      return true;
    }
    return userNativeBalances[ecosystemId].lessThan(
      feesEstimation[ecosystemId],
    );
  });
};
