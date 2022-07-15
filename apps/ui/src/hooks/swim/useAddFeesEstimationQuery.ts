import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
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
  amounts: readonly (Amount | null)[],
  lpTargetEcosystem: EcosystemId,
): Decimal => {
  const tokenCount = new Decimal(countNonZeroAmounts(amounts, ecosystemId));
  const transferToGas = tokenCount.mul(APPROVAL_CEILING + TRANSFER_CEILING);
  const redeemGas = lpTargetEcosystem === ecosystemId ? REDEEM_CEILING : ZERO;
  return transferToGas.add(redeemGas);
};

export const useAddFeesEstimationQuery = (
  amounts: readonly (Amount | null)[],
  lpTargetEcosystem: EcosystemId,
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
    useGasPriceQuery(ETHEREUM_ECOSYSTEM_ID).data ?? ZERO,
    useGasPriceQuery(BNB_ECOSYSTEM_ID).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Avalanche).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Polygon).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Aurora).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Fantom).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Karura).data ?? ZERO,
    // useGasPriceQuery(EcosystemId.Acala).data ?? ZERO,
  ];
  const requiredEvmEcosystemIds = [
    ...getIncludedEvmEcosystemIds(amounts),
    lpTargetEcosystem,
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
    (ecosystemId) => calculateGas(ecosystemId, amounts, lpTargetEcosystem),
    ECOSYSTEM_IDS,
  );
  return {
    [SOLANA_ECOSYSTEM_ID]: SOLANA_FEE,
    [ETHEREUM_ECOSYSTEM_ID]: ethGas.mul(ethGasPrice.toString()),
    [BNB_ECOSYSTEM_ID]: bnbGas.mul(bnbGasPrice.toString()),
    // [EcosystemId.Avalanche]: avalancheGas.mul(avalancheGasPrice.toString()),
    // [EcosystemId.Polygon]: polygonGas.mul(polygonGasPrice.toString()),
    // [EcosystemId.Aurora]: auroraGas.mul(auroraGasPrice.toString()),
    // [EcosystemId.Fantom]: fantomGas.mul(fantomGasPrice.toString()),
    // [EcosystemId.Karura]: karuraGas.mul(karuraGasPrice.toString()),
    // [EcosystemId.Acala]: acalaGas.mul(acalaGasPrice.toString()),
  };
};
