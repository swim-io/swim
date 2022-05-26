import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEvmConnection, useEvmWallet } from "../../contexts";
import { useEnvironment } from "../../core/store";

export const useErc20BalancesQuery = (
  ecosystemId: EvmEcosystemId,
  contractAddresses: readonly string[],
): readonly UseQueryResult<Decimal | null, Error>[] => {
  const { env } = useEnvironment();
  const connection = useEvmConnection(ecosystemId);
  const { address: walletAddress } = useEvmWallet(ecosystemId);

  return useQueries(
    contractAddresses.map((contractAddress) => ({
      queryKey: [
        "erc20Balance",
        env,
        ecosystemId,
        contractAddress,
        walletAddress,
      ],
      queryFn: async (): Promise<Decimal | null> => {
        if (walletAddress === null) {
          return null;
        }
        return connection.getErc20Balance(contractAddress, walletAddress);
      },
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Decimal | null, Error>[];
};
