import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import type { Interaction } from "../../models";
import type { ReadonlyRecord } from "../../utils";

import { useEvmTxFeesEstimateQuery } from "./useEvmTxFeesEstimateQuery";

export type EvmTxFeesEstimates = ReadonlyRecord<EvmEcosystemId, Decimal | null>;

export const useEvmTxFeesEstimates = (
  interaction: Interaction | null,
): { readonly estimates: EvmTxFeesEstimates; readonly isSuccess: boolean } => {
  const queries: ReadonlyRecord<
    EvmEcosystemId,
    UseQueryResult<Decimal | null, Error>
  > = {
    ethereum: useEvmTxFeesEstimateQuery("ethereum", interaction),
    bnb: useEvmTxFeesEstimateQuery("bnb", interaction),
    // [EcosystemId.Avalanche]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Avalanche,
    //   interaction,
    // ),
    // [EcosystemId.Polygon]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Polygon,
    //   interaction,
    // ),
    // [EcosystemId.Aurora]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Aurora,
    //   interaction,
    // ),
    // [EcosystemId.Fantom]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Fantom,
    //   interaction,
    // ),
    // [EcosystemId.Karura]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Karura,
    //   interaction,
    // ),
    // [EcosystemId.Acala]: useEvmTxFeesEstimateQuery(
    //   EcosystemId.Acala,
    //   interaction,
    // ),
  };

  return {
    estimates: {
      ethereum: queries.ethereum.data ?? null,
      bnb: queries.bnb.data ?? null,
      // [EcosystemId.Avalanche]: queries[EcosystemId.Avalanche].data ?? null,
      // [EcosystemId.Polygon]: queries[EcosystemId.Polygon].data ?? null,
      // [EcosystemId.Aurora]: queries[EcosystemId.Aurora].data ?? null,
      // [EcosystemId.Fantom]: queries[EcosystemId.Fantom].data ?? null,
      // [EcosystemId.Karura]: queries[EcosystemId.Karura].data ?? null,
      // [EcosystemId.Acala]: queries[EcosystemId.Acala].data ?? null,
    },
    isSuccess: Object.entries(queries).every(
      ([ecosystemId, queryResult]) =>
        !isEcosystemEnabled(ecosystemId as EvmEcosystemId) ||
        queryResult.isSuccess,
    ),
  };
};
