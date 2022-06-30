import type { ethers } from "ethers";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { isEcosystemEnabled } from "../../config";
import { useEnvironment } from "../../core/store";
import type { EvmTx } from "../../models";
import { INTERACTION_ID_LENGTH_HEX } from "../../models";
import { isNotNull } from "../../utils";
import { useEvmConnection, useEvmHistoryQuery } from "../evm";

const MAX_RECENT_TXS = 1000;

const findEvmInteractionId = (
  txResponse: ethers.providers.TransactionResponse,
): string | null => {
  const dataHex = txResponse.data.replace(/^0x/, ""); // Remove 0x prefix
  if (dataHex.length < INTERACTION_ID_LENGTH_HEX) {
    return null;
  }
  return dataHex.slice(-INTERACTION_ID_LENGTH_HEX);
};

export const useEvmTxsForInteractionQuery = (
  ecosystemId: EvmEcosystemId,
  interactionId: string,
): UseQueryResult<readonly EvmTx[], Error> => {
  const { env } = useEnvironment();
  const connection = useEvmConnection(ecosystemId);
  const { data: history = [], isSuccess } = useEvmHistoryQuery(ecosystemId);

  return useQuery(
    [env, "txsForInteraction", interactionId, ecosystemId],
    async () => {
      const evmTxsOrNull = await Promise.all(
        history
          .filter(isNotNull)
          .slice(0, MAX_RECENT_TXS)
          .map(async (txResponse: ethers.providers.TransactionResponse) => {
            if (interactionId !== findEvmInteractionId(txResponse)) {
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
      enabled: isEcosystemEnabled(ecosystemId) && isSuccess,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
};
