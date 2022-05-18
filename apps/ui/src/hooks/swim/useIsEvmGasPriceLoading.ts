import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";

import { useGasPriceQuery } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly EvmEcosystemId[],
): boolean => {
  const isGasPriceLoading = {
    [EcosystemId.Ethereum]: useGasPriceQuery(EcosystemId.Ethereum).isLoading,
    [EcosystemId.Bsc]: useGasPriceQuery(EcosystemId.Bsc).isLoading,
    [EcosystemId.Avalanche]: useGasPriceQuery(EcosystemId.Avalanche).isLoading,
    [EcosystemId.Polygon]: useGasPriceQuery(EcosystemId.Polygon).isLoading,
  };
  return ecosystemIds.some((ecosystemId) => isGasPriceLoading[ecosystemId]);
};
