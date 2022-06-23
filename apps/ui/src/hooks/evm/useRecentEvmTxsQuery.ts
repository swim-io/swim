import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEvmConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import type { EvmTx } from "../../models";
import { findEvmInteractionId } from "../../models";
import { isNotNull } from "../../utils";

import { useEvmWallet } from "./useEvmWallet";

const MAX_RECENT_TXS = 1000;

export const useRecentEvmTxsQuery = (
  ecosystemId: EvmEcosystemId,
  recentInteractionIds: readonly string[],
): UseQueryResult<readonly EvmTx[] | null, Error> => {
  const { env } = useEnvironment();
  const { address } = useEvmWallet();
  const queryKey = ["evmTxs", env, ecosystemId, address];
  const connection = useEvmConnection(ecosystemId);

  return useQuery<readonly EvmTx[] | null, Error>(
    queryKey,
    async () => {
      if (!address) {
        return null;
      }
      const history = await connection.getHistory(address);
      if (history === null) {
        return null;
      }

      const evmTxsOrNull = await Promise.all(
        history
          .filter(isNotNull)
          .slice(0, MAX_RECENT_TXS)
          .map(async (txResponse) => {
            const interactionId = findEvmInteractionId(
              txResponse.data,
              recentInteractionIds,
            );
            if (!interactionId) {
              // skip irrelevant transactions because fetching transaction receipts is expensive
              return null;
            }

            const txReceipt = await connection.getTxReceipt(txResponse);
            if (txReceipt === null) {
              return null;
            }

            return {
              ecosystem: ecosystemId,
              txId: txResponse.hash,
              timestamp: txResponse.timestamp ?? null,
              interactionId: interactionId,
              // TODO: find way to not have to fetch all transaction receipts individually
              txResponse,
              txReceipt,
            };
          }),
      );

      return evmTxsOrNull.filter(isNotNull);
    },
    {
      enabled: isEcosystemEnabled(ecosystemId),
    },
  );
};
