import type { EvmEcosystemId } from "@swim-io/evm";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmClient } from "./useEvmClient";
import { useEvmWallet } from "./useEvmWallet";

export const useErc20BalancesQuery = (
  ecosystemId: EvmEcosystemId,
  contractAddresses: readonly string[],
): readonly UseQueryResult<Decimal | null, Error>[] => {
  const { env } = useEnvironment();
  const client = useEvmClient(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQueries(
    contractAddresses.map((contractAddress) => ({
      queryKey: [
        env,
        "erc20Balance",
        ecosystemId,
        contractAddress,
        walletAddress,
      ],
      queryFn: async (): Promise<Decimal | null> => {
        if (walletAddress === null) {
          return null;
        }
        return client.getTokenBalance(contractAddress, walletAddress);
      },
      enabled: isEcosystemEnabled(ecosystemId),
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Decimal | null, Error>[];
};
