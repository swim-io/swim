import type { ConfirmedSignatureInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Env } from "@swim-io/core";
import type { EvmClient, EvmEcosystemId, EvmTx } from "@swim-io/evm";
import { isEvmEcosystemId } from "@swim-io/evm";
import type { SolanaClient, SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { isNotNull } from "@swim-io/utils";
import type { ethers } from "ethers";
import type { QueryClient } from "react-query";

import type { EcosystemId } from "../../config";

export const INTERACTION_ID_LENGTH = 16;
export const INTERACTION_ID_LENGTH_HEX = INTERACTION_ID_LENGTH * 2;

export const generateId = (length = INTERACTION_ID_LENGTH): string => {
  const idBytes = crypto.getRandomValues(new Uint8Array(length));
  return Buffer.from(idBytes).toString("hex");
};

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
  getEvmClient: (ecosystemId: EvmEcosystemId) => EvmClient,
  evmAddress: string,
  requiredEcosystems: ReadonlySet<EcosystemId>,
): Promise<readonly EvmTx[]> => {
  const requiredEvmEcosystems = [...requiredEcosystems.values()].filter(
    isEvmEcosystemId,
  );

  const nestedTxs = await Promise.all(
    requiredEvmEcosystems.map(async (ecosystemId) => {
      const client = getEvmClient(ecosystemId);
      const history = await queryClient.fetchQuery(
        [env, "evmHistory", ecosystemId, evmAddress],
        async () => (await client.getHistory(evmAddress)) ?? [],
      );
      const matchedTxResponses = history.filter(
        (txResponse) => findEvmInteractionId(txResponse) === interactionId,
      );
      const evmTxsOrNull = await Promise.all(
        matchedTxResponses.map(
          async (txResponse: ethers.providers.TransactionResponse) => {
            const txReceipt = await client.getTxReceipt(txResponse);
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

const MAX_RECENT_SIGNATURES = 1000;
const INTERACTION_ID_MATCH_GROUP = "interactionId";
const MEMO_LOG_REGEXP = new RegExp(
  `^Program log: Memo \\(len ${INTERACTION_ID_LENGTH_HEX}\\): "(?<${INTERACTION_ID_MATCH_GROUP}>[0-9a-f]{${INTERACTION_ID_LENGTH_HEX}})"$`,
);

const addSolanaInteractionId = async (
  solanaClient: SolanaClient,
  env: Env,
  signatureInfo: ConfirmedSignatureInfo,
): Promise<{
  readonly signatureInfo: ConfirmedSignatureInfo;
  readonly interactionId: string | null;
}> => {
  // NOTE: This seems to work on mainnet but not teamnet
  if (signatureInfo.memo !== null) {
    // for some reason, memo returns "z7f8sdzfidf" as "[32] z7f8sdzfidf", so we strip the weird prefix
    return {
      signatureInfo,
      interactionId: signatureInfo.memo.replace(/^\[[0-9]+\]\s+/, ""),
    };
  }

  // The workaround below requires many RPC calls which we don't want anywhere but local/teamnet
  if (env !== Env.Local && env !== Env.Custom) {
    return { signatureInfo, interactionId: null };
  }

  const tx = await solanaClient.getTx(signatureInfo.signature);
  // NOTE: Getting the ID from the log is more brittle but simpler than getting it from the instructions
  const memoLog =
    tx.meta?.logMessages?.find((log) => MEMO_LOG_REGEXP.test(log)) ?? null;
  const match = memoLog?.match(MEMO_LOG_REGEXP);
  const interactionId = match?.groups?.[INTERACTION_ID_MATCH_GROUP] ?? null;
  return { signatureInfo, interactionId };
};

export const fetchSolanaTxsForInteractionId = async (
  interactionId: string,
  queryClient: QueryClient,
  env: Env,
  solanaClient: SolanaClient,
  solanaAddress: string,
): Promise<readonly SolanaTx[]> => {
  // fetch all transaction signatures first, this can easily be 1000 txs but it counts as one RPC call
  const txInfos = await queryClient.fetchQuery(
    [env, "solanaHistory", solanaAddress],
    () => {
      return solanaClient.connection.getSignaturesForAddress(
        new PublicKey(solanaAddress),
        {
          limit: MAX_RECENT_SIGNATURES, // 1-1000, default = 1000
        },
      );
    },
  );

  const txInfosAndInteractionIds = (
    await Promise.all(
      txInfos.map((txInfo) =>
        addSolanaInteractionId(solanaClient, env, txInfo),
      ),
    )
  ).filter((txInfo) => txInfo.interactionId === interactionId);

  const parsedTxs = await solanaClient.getParsedTxs(
    txInfosAndInteractionIds.map(
      ({ signatureInfo }) => signatureInfo.signature,
    ),
  );

  return txInfosAndInteractionIds.map(
    ({ signatureInfo: { blockTime, signature } }, index) => ({
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      id: signature,
      timestamp: blockTime ?? null,
      interactionId,
      parsedTx: parsedTxs[index],
    }),
  );
};
