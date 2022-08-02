import Decimal from "decimal.js";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";
import type { FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
} from "../../models";

import { useGasPriceQueries } from "./useGasPriceQuery";
import { useIsEvmGasPriceLoading } from "./useIsEvmGasPriceLoading";

const ZERO = new Decimal(0);

const calculateGas = (
  ecosystemId: EvmEcosystemId,
  fromToken: TokenSpec | null,
  toToken: TokenSpec | null,
): Decimal => {
  const fromRequirements =
    fromToken?.nativeEcosystemId === ecosystemId
      ? [APPROVAL_CEILING, TRANSFER_CEILING]
      : [];
  const toRequirements =
    toToken?.nativeEcosystemId === ecosystemId ? [REDEEM_CEILING] : [];
  return [...fromRequirements, ...toRequirements].reduce(
    (acc, requirement) => acc.plus(requirement),
    ZERO,
  );
};

export const useSwapFeesEstimationQuery = (
  fromToken: TokenSpec | null,
  toToken: TokenSpec | null,
): Partial<FeesEstimation> | null => {
  const requiredEvmEcosystemIds = Array.from(
    new Set([fromToken?.nativeEcosystemId, toToken?.nativeEcosystemId]),
  ).filter(
    (ecosystemId): ecosystemId is EvmEcosystemId =>
      ecosystemId !== undefined && isEvmEcosystemId(ecosystemId),
  );

  const gasPrices = useGasPriceQueries(requiredEvmEcosystemIds).map(
    (queryResult) => queryResult.data ?? ZERO,
  );
  const isRequiredGasPriceLoading = useIsEvmGasPriceLoading(
    requiredEvmEcosystemIds,
  );
  if (isRequiredGasPriceLoading) {
    return null;
  }

  return {
    [EcosystemId.Solana]: SOLANA_FEE,
    ...Object.fromEntries(
      requiredEvmEcosystemIds.map((ecosystemId, i) => {
        return [
          ecosystemId,
          calculateGas(ecosystemId, fromToken, toToken).mul(
            gasPrices[i].toString(),
          ),
        ];
      }),
    ),
  };
};
