import type { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import { isNotNull } from "@swim-io/utils";
import type { ethers } from "ethers";
import type { QueryClient } from "react-query";

import type { EcosystemId, EvmEcosystemId } from "../../config";
import { isEvmEcosystemId } from "../../config";
import type { EvmTx } from "../crossEcosystem";
import { INTERACTION_ID_LENGTH_HEX } from "../utils";

import type { EvmConnection } from "./EvmConnection";

const findEvmInteractionId = (
  txResponse: ethers.providers.TransactionResponse,
): string | null => {
  const dataHex = txResponse.data.replace(/^0x/, ""); // Remove 0x prefix
  if (dataHex.length < INTERACTION_ID_LENGTH_HEX) {
    return null;
  }
  return dataHex.slice(-INTERACTION_ID_LENGTH_HEX);
};

export const fetchEvmTxForInteractionId = async (
  interactionId: string,
  queryClient: QueryClient,
  env: Env,
  evmConnections: ReadonlyRecord<EvmEcosystemId, EvmConnection>,
  evmAddress: string,
  requiredEcosystems: ReadonlySet<EcosystemId>,
): Promise<readonly EvmTx[]> => {
  const requiredEvmEcosystems = [...requiredEcosystems.values()].filter(
    isEvmEcosystemId,
  );

  const nestedTxs = await Promise.all(
    requiredEvmEcosystems.map(async (ecosystemId) => {
      const connection = evmConnections[ecosystemId];
      const history = await queryClient.fetchQuery(
        [env, "evmHistory", ecosystemId, evmAddress],
        async () => (await connection.getHistory(evmAddress)) ?? [],
      );
      const matchedTxResponses = history.filter(
        (txResponse) => findEvmInteractionId(txResponse) === interactionId,
      );
      const evmTxsOrNull = await Promise.all(
        matchedTxResponses.map(
          async (txResponse: ethers.providers.TransactionResponse) => {
            const txReceipt = await connection.getTxReceipt(txResponse);
            if (txReceipt === null) {
              return null;
            }
            return {
              ecosystemId,
              id: txResponse.hash,
              timestamp: txResponse.timestamp ?? null,
              interactionId: interactionId,
              response: txResponse,
              receipt: txReceipt,
            };
          },
        ),
      );
      return evmTxsOrNull.filter(isNotNull);
    }),
  );

  return nestedTxs.flat();
};
