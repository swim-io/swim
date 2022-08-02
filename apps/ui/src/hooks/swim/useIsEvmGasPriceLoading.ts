import type { EvmEcosystemId } from "../../config";
import { EcosystemId } from "../../config";

import { useGasPriceQuery } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly EvmEcosystemId[],
): boolean => {
  const isGasPriceLoading = {
    [EcosystemId.Ethereum]: useGasPriceQuery(EcosystemId.Ethereum, {
      enabled: ecosystemIds.includes(EcosystemId.Ethereum),
    }).isLoading,
    [EcosystemId.Bnb]: useGasPriceQuery(EcosystemId.Bnb, {
      enabled: ecosystemIds.includes(EcosystemId.Bnb),
    }).isLoading,
    [EcosystemId.Avalanche]: useGasPriceQuery(EcosystemId.Avalanche, {
      enabled: ecosystemIds.includes(EcosystemId.Avalanche),
    }).isLoading,
    [EcosystemId.Polygon]: useGasPriceQuery(EcosystemId.Polygon, {
      enabled: ecosystemIds.includes(EcosystemId.Polygon),
    }).isLoading,
    [EcosystemId.Aurora]: useGasPriceQuery(EcosystemId.Aurora, {
      enabled: ecosystemIds.includes(EcosystemId.Aurora),
    }).isLoading,
    [EcosystemId.Fantom]: useGasPriceQuery(EcosystemId.Fantom, {
      enabled: ecosystemIds.includes(EcosystemId.Fantom),
    }).isLoading,
    [EcosystemId.Karura]: useGasPriceQuery(EcosystemId.Karura, {
      enabled: ecosystemIds.includes(EcosystemId.Karura),
    }).isLoading,
    [EcosystemId.Acala]: useGasPriceQuery(EcosystemId.Acala, {
      enabled: ecosystemIds.includes(EcosystemId.Acala),
    }).isLoading,
  };
  return ecosystemIds.some((ecosystemId) => isGasPriceLoading[ecosystemId]);
};
