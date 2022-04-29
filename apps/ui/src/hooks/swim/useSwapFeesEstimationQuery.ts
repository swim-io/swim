import Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
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

export const useSwapFeesEstimationQuery = (
  fromToken: TokenSpec | null,
  toToken: TokenSpec | null,
): FeesEstimation | null => {
  const { data: ethGasPrice } = useGasPriceQuery(EcosystemId.Ethereum);
  const { data: bscGasPrice } = useGasPriceQuery(EcosystemId.Bsc);

  if (!ethGasPrice || !bscGasPrice) {
    return null;
  }

  let ethGas = new Decimal(0);
  if (fromToken?.nativeEcosystem === EcosystemId.Ethereum) {
    ethGas = ethGas.add(APPROVAL_CEILING + TRANSFER_CEILING);
  }
  if (toToken?.nativeEcosystem === EcosystemId.Ethereum) {
    ethGas = ethGas.add(REDEEM_CEILING);
  }
  let bscGas = new Decimal(0);
  if (fromToken?.nativeEcosystem === EcosystemId.Bsc) {
    bscGas = bscGas.add(APPROVAL_CEILING + TRANSFER_CEILING);
  }
  if (toToken?.nativeEcosystem === EcosystemId.Bsc) {
    bscGas = bscGas.add(REDEEM_CEILING);
  }

  return {
    [EcosystemId.Ethereum]: ethGas.mul(ethGasPrice.toString()),
    [EcosystemId.Bsc]: bscGas.mul(bscGasPrice.toString()),
    [EcosystemId.Solana]: SOLANA_FEE,
    [EcosystemId.Avalanche]: ZERO,
    [EcosystemId.Polygon]: ZERO,
    [EcosystemId.Terra]: ZERO,
  };
};
