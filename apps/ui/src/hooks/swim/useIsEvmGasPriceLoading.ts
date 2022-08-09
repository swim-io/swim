import type { EvmEcosystemId } from "../../config";

import { useGasPriceQueries } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly EvmEcosystemId[],
): boolean => {
  return useGasPriceQueries(ecosystemIds).some(
    (queryResult) => queryResult.isLoading,
  );
};
