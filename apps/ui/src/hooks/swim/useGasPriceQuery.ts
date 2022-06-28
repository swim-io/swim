import Decimal from "decimal.js";
import { utils as ethersUtils } from "ethers";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEvmConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";

// Query for gas price in native currency
// e.g. ETH for Ethereum, BNB for Binance Smart Chain
export const useGasPriceQuery = (
  evmEcosystemId: EvmEcosystemId,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const connection = useEvmConnection(evmEcosystemId);
  return useQuery(
    ["gasPrice", env, evmEcosystemId],
    async () => {
      const gasPriceInWei = await connection.provider.getGasPrice();
      const gasPriceInNativeCurrency = new Decimal(
        ethersUtils.formatUnits(gasPriceInWei),
      );
      // Multiply by 1.1 to give some margin
      return gasPriceInNativeCurrency.mul(1.1);
    },
    {
      enabled: isEcosystemEnabled(evmEcosystemId),
    },
  );
};
