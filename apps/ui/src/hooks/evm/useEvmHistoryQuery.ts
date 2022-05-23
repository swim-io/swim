import type { ethers } from "ethers";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEnvironment, useEvmConnection, useEvmWallet } from "../../contexts";

export const useEvmHistoryQuery = (
  ecosystemId: EvmEcosystemId,
): UseQueryResult<readonly ethers.providers.TransactionResponse[], Error> => {
  const { env } = useEnvironment();
  const { address } = useEvmWallet(ecosystemId);
  const connection = useEvmConnection(ecosystemId);

  return useQuery(
    [env, "evmHistory", ecosystemId, address],
    async () => {
      if (address === null) {
        throw new Error(`${ecosystemId} address not found`);
      }
      return await connection.getHistory(address);
    },
    {
      enabled: !!address,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
};
