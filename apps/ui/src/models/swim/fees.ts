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
const POLKADOT_EXISTENTIAL_DEPOSIT_AMOUNT = new Decimal(0.1);

export const getLowBalanceWallets = (
  feesEstimation: FeesEstimation | null,
  userNativeBalances: ReadonlyRecord<EcosystemId, Decimal>,
): readonly EcosystemId[] => {
  if (feesEstimation === null) {
    return [];
  }
  return getRecordKeys(feesEstimation).filter((ecosystemId) => {
    const fee = feesEstimation[ecosystemId];
    if (
      [EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId) &&
      !fee.isZero() &&
      userNativeBalances[ecosystemId].lessThan(
        POLKADOT_EXISTENTIAL_DEPOSIT_AMOUNT.add(fee),
      )
    ) {
      // If a Polkadot related tx is susceptible to dropping below the existential deposit requirement,
      // their tx may fail (or their account may get reaped).
      return true;
    }
    return userNativeBalances[ecosystemId].lessThan(fee);
  });
};
