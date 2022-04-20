import Decimal from "decimal.js";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import type { FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
} from "../../models";

import { useGasPriceQuery } from "./useGasPriceQuery";

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
  const { data: ethGasPrice } = useGasPriceQuery(EcosystemId.Ethereum);
  const { data: bscGasPrice } = useGasPriceQuery(EcosystemId.Bsc);
  const { data: avalancheGasPrice } = useGasPriceQuery(EcosystemId.Avalanche);
  const { data: polygonGasPrice } = useGasPriceQuery(EcosystemId.Polygon);

  if (!ethGasPrice || !bscGasPrice || !avalancheGasPrice || !polygonGasPrice) {
    return null;
  }

  const evmEcosystemIds: readonly EvmEcosystemId[] = [
    EcosystemId.Ethereum,
    EcosystemId.Bsc,
    EcosystemId.Avalanche,
    EcosystemId.Polygon,
  ];
  const [ethGas, bscGas, avalancheGas, polygonGas] = evmEcosystemIds.map(
    (ecosystemId: EvmEcosystemId) =>
      calculateGas(ecosystemId, fromToken, toToken),
  );

  return {
    [EcosystemId.Solana]: SOLANA_FEE,
    [EcosystemId.Ethereum]: ethGas.mul(ethGasPrice.toString()),
    [EcosystemId.Bsc]: bscGas.mul(bscGasPrice.toString()),
    [EcosystemId.Terra]: ZERO,
    [EcosystemId.Avalanche]: avalancheGas.mul(avalancheGasPrice.toString()),
    [EcosystemId.Polygon]: polygonGas.mul(polygonGasPrice.toString()),
  };
};
