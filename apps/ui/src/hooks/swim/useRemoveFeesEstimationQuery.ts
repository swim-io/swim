import { EvmEcosystemId, isEvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { filterMap } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { EcosystemId } from "../../config";
import { ECOSYSTEM_IDS } from "../../config";
import type { Amount, FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
  countNonZeroAmounts,
  getIncludedEvmEcosystemIds,
} from "../../models";

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
    avalancheGasPrice,
    polygonGasPrice,
    auroraGasPrice,
    fantomGasPrice,
    karuraGasPrice,
    acalaGasPrice,
  ] = [
    useGasPriceQuery(EvmEcosystemId.Ethereum).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Bnb).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Avalanche).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Polygon).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Aurora).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Fantom).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Karura).data ?? ZERO,
    useGasPriceQuery(EvmEcosystemId.Acala).data ?? ZERO,
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
    avalancheGas,
    polygonGas,
    auroraGas,
    fantomGas,
    karuraGas,
    acalaGas,
  ] = filterMap(
    isEvmEcosystemId,
    (ecosystemId) =>
      calculateGas(ecosystemId, outputAmounts, lpTokenSourceEcosystem),
    ECOSYSTEM_IDS,
  );
  return {
    [SOLANA_ECOSYSTEM_ID]: SOLANA_FEE,
    [EvmEcosystemId.Ethereum]: ethGas.mul(ethGasPrice.toString()),
    [EvmEcosystemId.Bnb]: bnbGas.mul(bnbGasPrice.toString()),
    [EvmEcosystemId.Avalanche]: avalancheGas.mul(avalancheGasPrice.toString()),
    [EvmEcosystemId.Polygon]: polygonGas.mul(polygonGasPrice.toString()),
    [EvmEcosystemId.Aurora]: auroraGas.mul(auroraGasPrice.toString()),
    [EvmEcosystemId.Fantom]: fantomGas.mul(fantomGasPrice.toString()),
    [EvmEcosystemId.Karura]: karuraGas.mul(karuraGasPrice.toString()),
    [EvmEcosystemId.Acala]: acalaGas.mul(acalaGasPrice.toString()),
  };
};
