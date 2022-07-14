import type { EvmEcosystemId } from "../../config";
import type { EcosystemId } from "../../config";

import { useGasPriceQuery } from "./useGasPriceQuery";

export const useIsEvmGasPriceLoading = (
  ecosystemIds: readonly EvmEcosystemId[],
): boolean => {
  const isGasPriceLoading = {
    [ETHEREUM_ECOSYSTEM_ID]: useGasPriceQuery(ETHEREUM_ECOSYSTEM_ID).isLoading,
    [BNB_ECOSYSTEM_ID]: useGasPriceQuery(BNB_ECOSYSTEM_ID).isLoading,
    [EcosystemId.Avalanche]: useGasPriceQuery(EcosystemId.Avalanche).isLoading,
    [EcosystemId.Polygon]: useGasPriceQuery(EcosystemId.Polygon).isLoading,
    [EcosystemId.Aurora]: useGasPriceQuery(EcosystemId.Aurora).isLoading,
    [EcosystemId.Fantom]: useGasPriceQuery(EcosystemId.Fantom).isLoading,
    [EcosystemId.Karura]: useGasPriceQuery(EcosystemId.Karura).isLoading,
    [EcosystemId.Acala]: useGasPriceQuery(EcosystemId.Acala).isLoading,
  };
  return ecosystemIds.some((ecosystemId) => isGasPriceLoading[ecosystemId]);
};
