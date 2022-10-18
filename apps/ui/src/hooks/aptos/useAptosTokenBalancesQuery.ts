import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import type { TokenDetails } from "@swim-io/core";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQueries } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useAptosClient } from "./useAptosClient";
import { useAptosWallet } from "./useAptosWallet";

export const useAptosTokenBalancesQuery = (
  tokenDetails: readonly TokenDetails[],
): readonly UseQueryResult<Decimal | null, Error>[] => {
  const { env } = useEnvironment();
  const aptosClient = useAptosClient();
  const { address: walletAddress } = useAptosWallet();

  return useQueries(
    tokenDetails.map((details) => ({
      queryKey: [env, "aptosBalance", details.address, walletAddress],
      queryFn: async (): Promise<Decimal | null> => {
        if (walletAddress === null) {
          return null;
        }
        return aptosClient.getTokenBalance(walletAddress, details);
      },
      enabled: isEcosystemEnabled(APTOS_ECOSYSTEM_ID),
    })),
    // useQueries does not support types without casting
    // See https://github.com/tannerlinsley/react-query/issues/1675
  ) as readonly UseQueryResult<Decimal | null, Error>[];
};
