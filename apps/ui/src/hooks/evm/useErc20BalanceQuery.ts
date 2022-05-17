import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEvmConnection, useEvmWallet } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useErc20BalanceQuery = (
  ecosystemId: EvmEcosystemId,
  contractAddress: string | null,
): UseQueryResult<Decimal | null, Error> => {
  const env = useEnvironment(selectEnv);
  const connection = useEvmConnection(ecosystemId);
  const { address: walletAddress } = useEvmWallet(ecosystemId);

  return useQuery(
    ["erc20Balance", env, ecosystemId, contractAddress, walletAddress],
    async () => {
      if (walletAddress === null || contractAddress === null) {
        return null;
      }
      return connection.getErc20Balance(contractAddress, walletAddress);
    },
  );
};
