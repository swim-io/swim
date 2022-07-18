import Decimal from "decimal.js";

import type { EcosystemId, EvmEcosystemId } from "../../config";
import { ECOSYSTEM_IDS, isEvmEcosystemId } from "../../config";
import type { Amount, FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
  countNonZeroAmounts,
  getIncludedEvmEcosystemIds,
} from "../../models";
import { filterMap } from "../../utils";

import { useGasPriceQuery } from "./useGasPriceQuery";
import { useIsEvmGasPriceLoading } from "./useIsEvmGasPriceLoading";

const ZERO = new Decimal(0);

const calculateGas = (
  ecosystemId: EvmEcosystemId,
  outputAmounts: readonly (Amount | null)[],
  lpTokenSourceEcosystem: EcosystemId,
): Decimal => {
  const tokenCount = new Decimal(
    countNonZeroAmounts(outputAmounts, ecosystemId),
  );
  const transferFromGas =
    lpTokenSourceEcosystem === ecosystemId
      ? APPROVAL_CEILING + TRANSFER_CEILING
      : ZERO;
  const redeemGas = tokenCount.mul(REDEEM_CEILING);
  return redeemGas.add(transferFromGas);
};

export const useRemoveFeesEstimationQuery = (
  outputAmounts: readonly (Amount | null)[],
  lpTokenSourceEcosystem: EcosystemId,
): FeesEstimation | null => {
  const [
    ethGasPrice,
    bnbGasPrice,
    // avalancheGasPrice,
    // polygonGasPrice,
    // auroraGasPrice,
    // fantomGasPrice,
    // karuraGasPrice,
    // acalaGasPrice,
  ] = [
    useGasPriceQuery("ethereum").data ?? ZERO,
    useGasPriceQuery("bnb").data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Avalanche).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Polygon).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Aurora).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Fantom).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Karura).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Acala).data ?? ZERO,
  ];
  const requiredEvmEcosystemIds = [
    ...getIncludedEvmEcosystemIds(outputAmounts),
    lpTokenSourceEcosystem,
  ].filter(isEvmEcosystemId);
  const isRequiredGasPriceLoading = useIsEvmGasPriceLoading(
    requiredEvmEcosystemIds,
  );
  if (isRequiredGasPriceLoading) {
    return null;
  }

  const [
    ethGas,
    bnbGas,
    // avalancheGas,
    // polygonGas,
    // auroraGas,
    // fantomGas,
    // karuraGas,
    // acalaGas,
  ] = filterMap(
    isEvmEcosystemId,
    (ecosystemId) =>
      calculateGas(ecosystemId, outputAmounts, lpTokenSourceEcosystem),
    ECOSYSTEM_IDS,
  );
  return {
    solana: SOLANA_FEE,
    ethereum: ethGas.mul(ethGasPrice.toString()),
    bnb: bnbGas.mul(bnbGasPrice.toString()),
    // [EcosystemId.Avalanche]: avalancheGas.mul(avalancheGasPrice.toString()),
    // [EcosystemId.Polygon]: polygonGas.mul(polygonGasPrice.toString()),
    // [EcosystemId.Aurora]: auroraGas.mul(auroraGasPrice.toString()),
    // [EcosystemId.Fantom]: fantomGas.mul(fantomGasPrice.toString()),
    // [EcosystemId.Karura]: karuraGas.mul(karuraGasPrice.toString()),
    // [EcosystemId.Acala]: acalaGas.mul(acalaGasPrice.toString()),
  };
};
