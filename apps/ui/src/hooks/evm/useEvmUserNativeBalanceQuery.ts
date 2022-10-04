import type { EvmEcosystemId } from "@swim-io/evm";
import Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmClient } from "./useEvmClient";
import { useEvmWallet } from "./useEvmWallet";

export const useEvmUserNativeBalanceQuery = (
  ecosystemId: EvmEcosystemId,
  options?: UseQueryOptions<Decimal, Error>,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const client = useEvmClient(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQuery<Decimal, Error>(
    [env, "evmNativeBalance", ecosystemId, walletAddress],
    async () => {
      if (!walletAddress) {
        return new Decimal(0);
      }
      return client.getGasBalance(walletAddress);
    },
    {
      ...options,
      enabled: isEcosystemEnabled(ecosystemId) && options?.enabled,
    },
  );
};
