import Decimal from "decimal.js";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import type { Amount, FeesEstimation } from "../../models";
import {
  APPROVAL_CEILING,
  REDEEM_CEILING,
  SOLANA_FEE,
  TRANSFER_CEILING,
  countNonZeroAmounts,
} from "../../models";

import { useGasPriceQuery } from "./useGasPriceQuery";

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
  const { data: ethGasPrice } = useGasPriceQuery(EcosystemId.Ethereum);
  const { data: bscGasPrice } = useGasPriceQuery(EcosystemId.Bsc);

  if (!ethGasPrice || !bscGasPrice) {
    return null;
  }
  const evmEcosystemIds: readonly EvmEcosystemId[] = [
    EcosystemId.Ethereum,
    EcosystemId.Bsc,
  ];
  const [ethGas, bscGas] = evmEcosystemIds.map((ecosystemId) =>
    calculateGas(ecosystemId, outputAmounts, lpTokenSourceEcosystem),
  );
  return {
    [EcosystemId.Ethereum]: ethGas.mul(ethGasPrice.toString()),
    [EcosystemId.Bsc]: bscGas.mul(bscGasPrice.toString()),
    [EcosystemId.Solana]: SOLANA_FEE,
    [EcosystemId.Avalanche]: ZERO,
    [EcosystemId.Polygon]: ZERO,
    [EcosystemId.Terra]: ZERO,
  };
};
