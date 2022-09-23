import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useAptosClient } from "./useAptosClient";
import { useAptosWallet } from "./useAptosWallet";

export const useAptosTokenBalancesQuery = (
  contractAddresses: readonly string[],
): readonly UseQueryResult<Decimal | null, Error>[] => {
  const { env } = useEnvironment();
  const aptosClient = useAptosClient();
  const { address: walletAddress } = useAptosWallet();

  return useQueries(
    contractAddresses.map((contractAddress) => ({
      queryKey: [env, "aptosBalance", contractAddress, walletAddress],
      queryFn: async (): Promise<Decimal | null> => {
        if (walletAddress === null) {
          return null;
        }
        return aptosClient.getTokenBalance(walletAddress, contractAddress);
      },
      enabled: isEcosystemEnabled(APTOS_ECOSYSTEM_ID),
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Decimal | null, Error>[];
};
