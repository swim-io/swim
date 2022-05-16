import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEvmConnection } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";

// Query for gas price in native currency
// e.g. ETH for Ethereum, BNB for Binance Smart Chain
export const useGasPriceQuery = (
  evmEcosystemId: EvmEcosystemId,
): UseQueryResult<Decimal, Error> => {
  const env = useEnvironmentStore(selectEnv);
  const connection = useEvmConnection(evmEcosystemId);
  return useQuery(["gasPrice", env, evmEcosystemId], async () => {
    // The BSC connection still returns the gas price in "wei" (ie 1e-18 BNB)
    // even though this is not a valid unit of BNB
    const gasPriceInWei = await connection.provider.getGasPrice();
    const gasPriceInNativeCurrency = new Decimal(gasPriceInWei.toString()).mul(
      1e-18,
    );
    // Multiply by 1.1 to give some margin
    return gasPriceInNativeCurrency.mul(1.1);
  });
};
