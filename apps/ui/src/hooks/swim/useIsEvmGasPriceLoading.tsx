import type { EvmEcosystemId } from "../../config";
import { EcosystemId, isEvmEcosystemId } from "../../config";

import { useGasPriceQuery } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly (EcosystemId | null)[],
): boolean => {
  const isGasPriceLoading = {
    [EcosystemId.Ethereum]: useGasPriceQuery(EcosystemId.Ethereum).isLoading,
    [EcosystemId.Bsc]: useGasPriceQuery(EcosystemId.Bsc).isLoading,
    [EcosystemId.Avalanche]: useGasPriceQuery(EcosystemId.Avalanche).isLoading,
    [EcosystemId.Polygon]: useGasPriceQuery(EcosystemId.Polygon).isLoading,
  };

  return ecosystemIds
    .filter((ecosystemId) => ecosystemId && isEvmEcosystemId(ecosystemId))
    .some((ecosystemId) => isGasPriceLoading[ecosystemId as EvmEcosystemId]);
};
