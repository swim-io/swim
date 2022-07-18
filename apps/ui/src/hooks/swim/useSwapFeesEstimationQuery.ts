import Decimal from "decimal.js";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { ECOSYSTEM_IDS, isEvmEcosystemId } from "../../config";
import type { FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
} from "../../models";
import { filterMap } from "../../utils";

import { useGasPriceQuery } from "./useGasPriceQuery";
import { useIsEvmGasPriceLoading } from "./useIsEvmGasPriceLoading";

const ZERO = new Decimal(0);

const calculateGas = (
  ecosystemId: EvmEcosystemId,
  fromToken: TokenSpec | null,
  toToken: TokenSpec | null,
): Decimal => {
  const fromRequirements =
    fromToken?.nativeEcosystem === ecosystemId
      ? [APPROVAL_CEILING, TRANSFER_CEILING]
      : [];
  const toRequirements =
    toToken?.nativeEcosystem === ecosystemId ? [REDEEM_CEILING] : [];
  return [...fromRequirements, ...toRequirements].reduce(
    (acc, requirement) => acc.plus(requirement),
    ZERO,
  );
};

export const useSwapFeesEstimationQuery = (
  fromToken: TokenSpec | null,
  toToken: TokenSpec | null,
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
    fromToken?.nativeEcosystem,
    toToken?.nativeEcosystem,
  ].filter(
    (ecosystemId): ecosystemId is EvmEcosystemId =>
      ecosystemId !== undefined && isEvmEcosystemId(ecosystemId),
  );
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
    (ecosystemId: EvmEcosystemId) =>
      calculateGas(ecosystemId, fromToken, toToken),
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
