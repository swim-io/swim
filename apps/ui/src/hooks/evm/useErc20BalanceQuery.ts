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
  contractAddress: string | null,
  options?: UseQueryOptions<Decimal | null, Error>,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const client = useEvmClient(ecosystemId);
  const { address: walletAddress } = useEvmWallet();

  return useQuery<Decimal | null, Error>(
    [env, "erc20Balance", ecosystemId, contractAddress, walletAddress],
    async (): Promise<Decimal | null> => {
      if (walletAddress === null || contractAddress === null) {
        return null;
      }
      return client.getTokenBalance(contractAddress, walletAddress);
    },
    {
      ...options,
      enabled: isEcosystemEnabled(ecosystemId) && options?.enabled,
    },
  );
};
