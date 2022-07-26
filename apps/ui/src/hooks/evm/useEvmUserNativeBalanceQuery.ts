import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmConnection } from "./useEvmConnection";
import { useEvmWallet } from "./useEvmWallet";

export const useEvmUserNativeBalanceQuery = (
  ecosystemId: EvmEcosystemId,
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
      enabled: isEcosystemEnabled(ecosystemId),
      staleTime: 60_000, // cache 1min
    },
  );
};
