import type { EvmEcosystemId } from "@swim-io/evm";
import type { ethers } from "ethers";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmClient } from "./useEvmClient";
import { useEvmWallet } from "./useEvmWallet";

export const useEvmHistoryQuery = (
  ecosystemId: EvmEcosystemId,
): UseQueryResult<readonly ethers.providers.TransactionResponse[], Error> => {
  const { env } = useEnvironment();
  const { address } = useEvmWallet();
  const client = useEvmClient(ecosystemId);

  return useQuery(
    [env, "evmHistory", ecosystemId, address],
    async () => {
      if (address === null) {
        throw new Error(`${ecosystemId} address not found`);
      }
      return await client.getHistory(address);
    },
    {
      enabled: isEcosystemEnabled(ecosystemId) && !!address,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
};
