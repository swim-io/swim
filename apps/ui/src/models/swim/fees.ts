import type { ReadonlyRecord } from "@swim-io/utils";
import { getRecordKeys } from "@swim-io/utils";
import Decimal from "decimal.js";

import { EcosystemId } from "../../config";

export type FeesEstimation = ReadonlyRecord<EcosystemId, Decimal>;

// NOTE: These are a little higher than the maximum gas requirements seen so far but we should keep an eye out for higher values
export const APPROVAL_CEILING = 70000;
export const TRANSFER_CEILING = 120000;
export const REDEEM_CEILING = 300000;
export const SOLANA_FEE = new Decimal(0.01);
const POLKADOT_EXISTENTIAL_DEPOSIT_AMOUNT = new Decimal(0.1);
export const ZERO = new Decimal(0);

export const ZERO_FEE = {
  [EcosystemId.Solana]: ZERO,
  [EcosystemId.Ethereum]: ZERO,
  [EcosystemId.Bnb]: ZERO,
  [EcosystemId.Avalanche]: ZERO,
  [EcosystemId.Polygon]: ZERO,
  [EcosystemId.Aurora]: ZERO,
  [EcosystemId.Fantom]: ZERO,
  [EcosystemId.Karura]: ZERO,
  [EcosystemId.Acala]: ZERO,
};

export const getLowBalanceWallets = (
  feesEstimation: Partial<FeesEstimation> | null,
  userNativeBalances: Partial<ReadonlyRecord<EcosystemId, Decimal>>,
): readonly EcosystemId[] => {
  if (feesEstimation === null) {
    return [];
  }
  return getRecordKeys(feesEstimation).filter((ecosystemId) => {
    const fee = feesEstimation[ecosystemId];
    if (!fee) {
      throw new Error(`Cannot find fee in ${ecosystemId}`);
    }

    const userNativeBalance = userNativeBalances[ecosystemId];
    if (!userNativeBalance) {
      throw new Error(`Cannot find user native balance in ${ecosystemId}`);
    }

    if (
      [EcosystemId.Acala, EcosystemId.Karura].includes(ecosystemId) &&
      !fee.isZero() &&
      userNativeBalance.lessThan(POLKADOT_EXISTENTIAL_DEPOSIT_AMOUNT.add(fee))
    ) {
      // If a Polkadot related tx is susceptible to dropping below the existential deposit requirement,
      // their tx may fail (or their account may get reaped).
      return true;
    }
    return userNativeBalance.lessThan(fee);
  });
};
