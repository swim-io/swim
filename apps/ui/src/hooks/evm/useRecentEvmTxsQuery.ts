import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEvmConnection, useEvmWallet } from "../../contexts";
import { selectEnv } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { EvmTx } from "../../models";
import { findEvmInteractionId } from "../../models";
import { isNotNull } from "../../utils";

const MAX_RECENT_TXS = 1000;

export const useRecentEvmTxsQuery = (
  ecosystemId: EvmEcosystemId,
  recentInteractionIds: readonly string[],
): UseQueryResult<readonly EvmTx[] | null, Error> => {
  const env = useEnvironment(selectEnv);
  const { address } = useEvmWallet(ecosystemId);
  const queryKey = ["evmTxs", env, ecosystemId, address];
  const connection = useEvmConnection(ecosystemId);

  return useQuery<readonly EvmTx[] | null, Error>(queryKey, async () => {
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
  });
};
