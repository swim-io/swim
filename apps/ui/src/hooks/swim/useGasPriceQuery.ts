import Decimal from "decimal.js";
import { utils as ethersUtils } from "ethers";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";
import { useEvmConnections } from "../evm";

export const useGasPriceQueries = (
  evmEcosystemIds: readonly EvmEcosystemId[],
): readonly UseQueryResult<Decimal, Error>[] => {
  const { env } = useEnvironment();
  const connections = useEvmConnections();

  return useQueries(
    evmEcosystemIds.map((evmEcosystemId) => ({
      queryKey: ["gasPrice", env, evmEcosystemId],
      queryFn: async () => {
        const gasPriceInWei = await connections[
          evmEcosystemId
        ].provider.getGasPrice();
        const gasPriceInNativeCurrency = new Decimal(
          ethersUtils.formatUnits(gasPriceInWei),
        );
        // Multiply by 1.1 to give some margin
        return gasPriceInNativeCurrency.mul(1.1);
      },
      enabled: isEcosystemEnabled(evmEcosystemId),
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Decimal, Error>[];
};

// Query for gas price in native currency
// e.g. ETH for Ethereum, BNB for Binance Smart Chain
export const useGasPriceQuery = (
  evmEcosystemId: EvmEcosystemId,
): UseQueryResult<Decimal, Error> => useGasPriceQueries([evmEcosystemId])[0];
