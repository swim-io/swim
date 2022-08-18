import type { EvmEcosystemId } from "@swim-io/evm";
import Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmConnection } from "./useEvmConnection";
import { useEvmWallet } from "./useEvmWallet";

export const useEvmUserNativeBalanceQuery = (
  ecosystemId: EvmEcosystemId,
  options?: UseQueryOptions<Decimal, Error>,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const evmConnection = useEvmConnection(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQuery<Decimal, Error>(
    ["evmNativeBalance", env, ecosystemId, walletAddress],
    async () => {
      if (!walletAddress) {
        return new Decimal(0);
      }
      return evmConnection.getEthBalance(walletAddress);
    },
    {
      ...options,
      enabled: isEcosystemEnabled(ecosystemId) && options?.enabled,
    },
  );
};
