import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmConnection } from "./useEvmConnection";
import { useEvmWallet } from "./useEvmWallet";

export const useErc20BalanceQuery = (
  ecosystemId: EvmEcosystemId,
  contractAddress: string | null,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const connection = useEvmConnection(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQuery(
    ["erc20Balance", env, ecosystemId, contractAddress, walletAddress],
    async () => {
      if (walletAddress === null || contractAddress === null) {
        return null;
      }
      return connection.getErc20Balance(contractAddress, walletAddress);
    },
    {
      enabled: isEcosystemEnabled(ecosystemId),
    },
  );
};
