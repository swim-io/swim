import type { TokenDetails } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import type Decimal from "decimal.js";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";

import { useEvmClient } from "./useEvmClient";
import { useEvmWallet } from "./useEvmWallet";

export const useErc20BalanceQuery = (
  ecosystemId: EvmEcosystemId,
  tokenDetails: TokenDetails | null,
  options?: UseQueryOptions<Decimal | null, Error>,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const client = useEvmClient(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQuery<Decimal | null, Error>(
    [env, "erc20Balance", ecosystemId, tokenDetails?.address, walletAddress],
    async (): Promise<Decimal | null> => {
      if (walletAddress === null || tokenDetails === null) {
        return null;
      }
      return client.getTokenBalance(walletAddress, tokenDetails);
    },
    {
      ...options,
      enabled: isEcosystemEnabled(ecosystemId) && options?.enabled,
    },
  );
};
