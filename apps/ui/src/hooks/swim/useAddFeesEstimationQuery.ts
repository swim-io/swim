import Decimal from "decimal.js";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";
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
  const [ethGasPrice, bscGasPrice, avalancheGasPrice, polygonGasPrice] = [
    useGasPriceQuery(EcosystemId.Ethereum).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Bsc).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Avalanche).data ?? ZERO,
    useGasPriceQuery(EcosystemId.Polygon).data ?? ZERO,
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

  const evmEcosystemIds: readonly EvmEcosystemId[] = [
    EcosystemId.Ethereum,
    EcosystemId.Bsc,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
  ];
  const [ethGas, bscGas, avalancheGas, polygonGas] = evmEcosystemIds.map(
    (ecosystemId) => calculateGas(ecosystemId, amounts, lpTargetEcosystem),
  );
  return {
    [EcosystemId.Solana]: SOLANA_FEE,
    [EcosystemId.Ethereum]: ethGas.mul(ethGasPrice.toString()),
    [EcosystemId.Bsc]: bscGas.mul(bscGasPrice.toString()),
    [EcosystemId.Terra]: ZERO,
    [EcosystemId.Avalanche]: avalancheGas.mul(avalancheGasPrice.toString()),
    [EcosystemId.Polygon]: polygonGas.mul(polygonGasPrice.toString()),
    [EcosystemId.Aurora]: ZERO,
    [EcosystemId.Fantom]: ZERO,
    [EcosystemId.Karura]: ZERO,
    [EcosystemId.Acala]: ZERO,
  };
};
