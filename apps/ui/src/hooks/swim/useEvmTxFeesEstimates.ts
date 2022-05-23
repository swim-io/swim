import type Decimal from "decimal.js";

import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";
import type { Interaction } from "../../models";
import type { ReadonlyRecord } from "../../utils";

import { useEvmTxFeesEstimateQuery } from "./useEvmTxFeesEstimateQuery";

export type EvmTxFeesEstimates = ReadonlyRecord<EvmEcosystemId, Decimal | null>;

export const useEvmTxFeesEstimates = (
  interaction: Interaction | null,
): { readonly estimates: EvmTxFeesEstimates; readonly isSuccess: boolean } => {
  const { data: ethereumEstimate = null, isSuccess: ethereumIsSuccess } =
    useEvmTxFeesEstimateQuery(EcosystemId.Ethereum, interaction);
  const { data: bscEstimate = null, isSuccess: bscIsSuccess } =
    useEvmTxFeesEstimateQuery(EcosystemId.Bsc, interaction);
  const { data: avalancheEstimate = null, isSuccess: avalancheIsSuccess } =
    useEvmTxFeesEstimateQuery(EcosystemId.Avalanche, interaction);
  const { data: polygonEstimate = null, isSuccess: polygonIsSuccess } =
    useEvmTxFeesEstimateQuery(EcosystemId.Polygon, interaction);

  return {
    estimates: {
      [EcosystemId.Ethereum]: ethereumEstimate,
      [EcosystemId.Bsc]: bscEstimate,
      [EcosystemId.Avalanche]: avalancheEstimate,
      [EcosystemId.Polygon]: polygonEstimate,
      [EcosystemId.Aurora]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Acala]: null,
    },
    isSuccess:
      ethereumIsSuccess &&
      bscIsSuccess &&
      avalancheIsSuccess &&
      polygonIsSuccess,
  };
};
