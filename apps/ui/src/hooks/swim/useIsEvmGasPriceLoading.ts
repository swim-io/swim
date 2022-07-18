import type { EvmEcosystemId } from "../../config";

import { useGasPriceQuery } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly EvmEcosystemId[],
): boolean => {
  const isGasPriceLoading = {
    ethereum: useGasPriceQuery("ethereum").isLoading,
    bnb: useGasPriceQuery("bnb").isLoading,
    // [EcosystemId.Avalanche]: useGasPriceQuery(EcosystemId.Avalanche).isLoading,
    // [EcosystemId.Polygon]: useGasPriceQuery(EcosystemId.Polygon).isLoading,
    // [EcosystemId.Aurora]: useGasPriceQuery(EcosystemId.Aurora).isLoading,
    // [EcosystemId.Fantom]: useGasPriceQuery(EcosystemId.Fantom).isLoading,
    // [EcosystemId.Karura]: useGasPriceQuery(EcosystemId.Karura).isLoading,
    // [EcosystemId.Acala]: useGasPriceQuery(EcosystemId.Acala).isLoading,
  };
  return ecosystemIds.some((ecosystemId) => isGasPriceLoading[ecosystemId]);
};
