import { useQuery, useQueryClient } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import type { FeesEstimation, TokenOption } from "../../models";
import {
  SOLANA_FEE,
  SwapType,
  ZERO_FEE,
  getRedeemFee,
  getSwapType,
  getTransferFee,
} from "../../models";
import { useEvmConnections } from "../evm";

export const useSwapFeesEstimationQueryV2 = (
  fromTokenOption: TokenOption,
  toTokenOption: TokenOption,
) => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const evmConnections = useEvmConnections();

  const swapType = getSwapType(fromTokenOption, toTokenOption);
  const fromEcosystem = fromTokenOption.ecosystemId;
  const toEcosystem = toTokenOption.ecosystemId;
  return useQuery<FeesEstimation, Error>(
    [env, "useSwapFeesEstimationQueryV2", fromEcosystem, toEcosystem],
    async () => {
      const transferFee = await getTransferFee(
        env,
        queryClient,
        fromEcosystem,
        evmConnections,
      );
      const redeemFee = await getRedeemFee(
        env,
        queryClient,
        toEcosystem,
        evmConnections,
      );
      switch (swapType) {
        case SwapType.SingleChainSolana:
          return {
            ...ZERO_FEE,
            [EcosystemId.Solana]: SOLANA_FEE,
          };
        case SwapType.SingleChainEvm:
          return {
            ...ZERO_FEE,
            [fromEcosystem]: transferFee.add(redeemFee),
          };
        case SwapType.CrossChainEvmToEvm:
        case SwapType.CrossChainEvmToSolana:
        case SwapType.CrossChainSolanaToEvm:
          return {
            ...ZERO_FEE,
            [fromEcosystem]: transferFee,
            [toEcosystem]: redeemFee,
          };
      }
    },
  );
};
