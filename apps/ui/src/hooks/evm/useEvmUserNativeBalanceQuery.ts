import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEvmConnection, useEvmWallet } from "../../contexts";
import { useEnvironment } from "../../core/store";

export const useEvmUserNativeBalanceQuery = (
  ecosystemId: EvmEcosystemId,
): UseQueryResult<Decimal, Error> => {
  const { env } = useEnvironment();
  const evmConnection = useEvmConnection(ecosystemId);
  const { address: walletAddress } = useEvmWallet(ecosystemId);

  return useQuery<Decimal, Error>(
    ["evmNativeBalance", env, ecosystemId, walletAddress],
    async () => {
      if (!walletAddress) {
        return new Decimal(0);
      }
      return evmConnection.getEthBalance(walletAddress);
    },
  );
};
