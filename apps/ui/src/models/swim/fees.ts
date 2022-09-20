import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { getRecordKeys } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { EcosystemId } from "../../config";

export type FeesEstimation = ReadonlyRecord<EcosystemId, Decimal>;

// NOTE: These are a little higher than the maximum gas requirements seen so far but we should keep an eye out for higher values
export const APPROVAL_CEILING = 70000;
export const TRANSFER_CEILING = 120000;
export const REDEEM_CEILING = 300000;
export const SOLANA_FEE = new Decimal(0.01);
const POLKADOT_EXISTENTIAL_DEPOSIT_AMOUNT = new Decimal(0.1);
export const ZERO = new Decimal(0);

export const ZERO_FEE = {
  [APTOS_ECOSYSTEM_ID]: ZERO,
  [SOLANA_ECOSYSTEM_ID]: ZERO,
  [EvmEcosystemId.Ethereum]: ZERO,
  [EvmEcosystemId.Bnb]: ZERO,
  [EvmEcosystemId.Avalanche]: ZERO,
  [EvmEcosystemId.Polygon]: ZERO,
  [EvmEcosystemId.Aurora]: ZERO,
  [EvmEcosystemId.Fantom]: ZERO,
  [EvmEcosystemId.Karura]: ZERO,
  [EvmEcosystemId.Acala]: ZERO,
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

    const polkadotEcosystems: readonly EcosystemId[] = [
      EvmEcosystemId.Acala,
      EvmEcosystemId.Karura,
    ];
    if (
      polkadotEcosystems.includes(ecosystemId) &&
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
