import Decimal from "decimal.js";

import { EcosystemId } from "../../config";
import type { FeesEstimation, TokenOption } from "../../models";
import { SOLANA_FEE, SwapType, getSwapType } from "../../models";

const ZERO = new Decimal(0);

const ZERO_FEE = {
  [EcosystemId.Solana]: ZERO,
  [EcosystemId.Ethereum]: ZERO,
  [EcosystemId.Bnb]: ZERO,
  [EcosystemId.Avalanche]: ZERO,
  [EcosystemId.Polygon]: ZERO,
  [EcosystemId.Aurora]: ZERO,
  [EcosystemId.Fantom]: ZERO,
  [EcosystemId.Karura]: ZERO,
  [EcosystemId.Acala]: ZERO,
};

export const useSwapFeesEstimationQueryV2 = (
  fromToken: TokenOption,
  toToken: TokenOption,
): FeesEstimation | null => {
  const swapType = getSwapType(fromToken, toToken);
  // const [
  //   ethGasPrice,
  //   bnbGasPrice,
  //   avalancheGasPrice,
  //   polygonGasPrice,
  //   auroraGasPrice,
  //   fantomGasPrice,
  //   karuraGasPrice,
  //   acalaGasPrice,
  // ] = [
  //   useGasPriceQuery(EcosystemId.Ethereum).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Bnb).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Avalanche).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Polygon).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Aurora).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Fantom).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Karura).data ?? ZERO,
  //   useGasPriceQuery(EcosystemId.Acala).data ?? ZERO,
  // ];

  switch (swapType) {
    case SwapType.SingleChainSolana:
      return {
        ...ZERO_FEE,
        [EcosystemId.Solana]: SOLANA_FEE,
      };
    default:
      return null;
  }
};
