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

import { useGasPriceQuery } from "./useGasPriceQuery";
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
): FeesEstimation | null => {
  const requiredEvmEcosystemIds = Array.from(
    new Set([fromToken?.nativeEcosystemId, toToken?.nativeEcosystemId]),
  ).filter(
    (ecosystemId): ecosystemId is EvmEcosystemId =>
      ecosystemId !== undefined && isEvmEcosystemId(ecosystemId),
  );

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
    useGasPriceQuery(EcosystemId.Ethereum, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Ethereum),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Bnb, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Bnb),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Avalanche, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Avalanche),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Polygon, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Polygon),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Aurora, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Aurora),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Fantom, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Fantom),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Karura, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Karura),
    }).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Acala, {
      enabled: requiredEvmEcosystemIds.includes(EcosystemId.Acala),
    }).data ?? ZERO,
  ];
  const isRequiredGasPriceLoading = useIsEvmGasPriceLoading(
    requiredEvmEcosystemIds,
  );
  if (isRequiredGasPriceLoading) {
    return null;
  }

  const calcGas = (ecosystemId: EvmEcosystemId): Decimal =>
    calculateGas(ecosystemId, fromToken, toToken);
  return {
    [EcosystemId.Solana]: SOLANA_FEE,
    [EcosystemId.Ethereum]: calcGas(EcosystemId.Ethereum).mul(
      ethGasPrice.toString(),
    ),
    [EcosystemId.Bnb]: calcGas(EcosystemId.Bnb).mul(bnbGasPrice.toString()),
    [EcosystemId.Avalanche]: calcGas(EcosystemId.Avalanche).mul(
      avalancheGasPrice.toString(),
    ),
    [EcosystemId.Polygon]: calcGas(EcosystemId.Polygon).mul(
      polygonGasPrice.toString(),
    ),
    [EcosystemId.Aurora]: calcGas(EcosystemId.Aurora).mul(
      auroraGasPrice.toString(),
    ),
    [EcosystemId.Fantom]: calcGas(EcosystemId.Fantom).mul(
      fantomGasPrice.toString(),
    ),
    [EcosystemId.Karura]: calcGas(EcosystemId.Karura).mul(
      karuraGasPrice.toString(),
    ),
    [EcosystemId.Acala]: calcGas(EcosystemId.Acala).mul(
      acalaGasPrice.toString(),
    ),
  };
};
