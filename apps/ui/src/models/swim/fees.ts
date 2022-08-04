import type { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import { getRecordKeys } from "@swim-io/utils";
import Decimal from "decimal.js";
import { utils as ethersUtils } from "ethers";
import type { QueryClient } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import type { EvmConnection } from "../evm";

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

export const getGasPrice = async (
  env: Env,
  queryClient: QueryClient,
  ecosystemId: EvmEcosystemId,
  evmConnections: ReadonlyRecord<EvmEcosystemId, EvmConnection>,
) => {
  const cacheKey = [env, "gasPrice", ecosystemId];
  const cache = queryClient.getQueryData<Decimal>(cacheKey);
  if (cache) {
    return cache;
  }
  const gasPriceInWei = await evmConnections[
    ecosystemId
  ].provider.getGasPrice();
  const gasPriceInNativeCurrency = new Decimal(
    ethersUtils.formatUnits(gasPriceInWei),
  );
  // Multiply by 1.1 to give some margin
  const gasPrice = gasPriceInNativeCurrency.mul(1.1);
  queryClient.setQueryData(cacheKey, gasPrice);
  return gasPrice;
};

export const getTransferFee = async (
  env: Env,
  queryClient: QueryClient,
  ecosystemId: EcosystemId,
  evmConnections: ReadonlyRecord<EvmEcosystemId, EvmConnection>,
) => {
  if (ecosystemId === EcosystemId.Solana) {
    return SOLANA_FEE;
  }
  const gasPrice = await getGasPrice(
    env,
    queryClient,
    ecosystemId,
    evmConnections,
  );
  return gasPrice.mul(APPROVAL_CEILING + TRANSFER_CEILING);
};

export const getRedeemFee = async (
  env: Env,
  queryClient: QueryClient,
  ecosystemId: EcosystemId,
  evmConnections: ReadonlyRecord<EvmEcosystemId, EvmConnection>,
) => {
  if (ecosystemId === EcosystemId.Solana) {
    return SOLANA_FEE;
  }
  const gasPrice = await getGasPrice(
    env,
    queryClient,
    ecosystemId,
    evmConnections,
  );
  return gasPrice.mul(REDEEM_CEILING);
};
