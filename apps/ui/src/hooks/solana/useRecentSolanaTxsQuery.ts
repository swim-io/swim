import type { ConfirmedSignatureInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { EcosystemId, Env } from "../../config";
import { useSolanaConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import type { SolanaConnection, SolanaTx } from "../../models";
import { INTERACTION_ID_LENGTH_HEX } from "../../models";

import { useSolanaWallet } from "./useSolanaWallet";

const MAX_RECENT_SIGNATURES = 1000;

/**
 * Technically this needs to be MAX_STORED_INTERACTIONS * (max number of Solana txs per interaction)
 * Max number of Solana txs per interaction is currently
 * - 4 per VAA x 4 tokens on add = 16
 * - 1 for pool interaction
 * - 1 for wormholing LP token to non-Solana chain
 *
 * So we need to parse at least 18 * 10 = 180 Solana txs which is expensive (despite it being
 * one request, each tx in the response counts towards RPC usage limits). So instead we do a little less.
 */
const MAX_RECENT_PARSED_TXS = 75;

const INTERACTION_ID_MATCH_GROUP = "interactionId";
const MEMO_LOG_REGEXP = new RegExp(
  `^Program log: Memo \\(len ${INTERACTION_ID_LENGTH_HEX}\\): "(?<${INTERACTION_ID_MATCH_GROUP}>[0-9a-f]{${INTERACTION_ID_LENGTH_HEX}})"$`,
);

const addSolanaInteractionId = async (
  solanaConnection: SolanaConnection,
  env: Env,
  signatureInfo: ConfirmedSignatureInfo,
): Promise<{
  readonly signatureInfo: ConfirmedSignatureInfo;
  readonly interactionId: string | null;
}> => {
  // NOTE: This seems to work on mainnet but not localnet
  if (signatureInfo.memo !== null) {
    // for some reason, memo returns "z7f8sdzfidf" as "[32] z7f8sdzfidf", so we strip the weird prefix
    return {
      signatureInfo,
      interactionId: signatureInfo.memo.replace(/^\[[0-9]+\]\s+/, ""),
    };
  }

  // The workaround below requires many RPC calls which we don't want anywhere but localnet
  if (env !== Env.Localnet && env !== Env.CustomLocalnet) {
    return { signatureInfo, interactionId: null };
  }

  const tx = await solanaConnection.getTx(signatureInfo.signature);
  // NOTE: Getting the ID from the log is more brittle but simpler than getting it from the instructions
  const memoLog =
    tx.meta?.logMessages?.find((log) => MEMO_LOG_REGEXP.test(log)) ?? null;
  const match = memoLog?.match(MEMO_LOG_REGEXP);
  const interactionId = match?.groups?.[INTERACTION_ID_MATCH_GROUP] ?? null;
  return { signatureInfo, interactionId };
};

export const useRecentSolanaTxsQuery = (): UseQueryResult<
  readonly SolanaTx[],
  Error
> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address } = useSolanaWallet();
  const queryKey = ["solanaTxs", env, address];
  return useQuery(
    queryKey,
    async () => {
      if (address === null) {
        throw new Error("Solana address not found");
      }

      // fetch all transaction signatures first, this can easily be 1000 txs but it counts as one RPC call
      const txInfos = await solanaConnection.getSignaturesForAddress(
        new PublicKey(address),
        {
          limit: MAX_RECENT_SIGNATURES, // 1-1000, default = 1000
        },
      );

      // asynchronously try to extract the interaction ID from each transaction
      const txInfosAndInteractionIds = (
        await Promise.all(
          txInfos.map(addSolanaInteractionId.bind(null, solanaConnection, env)),
        )
      )
        .filter(({ interactionId }) => interactionId !== null)
        // fetching each transaction is expensive
        .slice(0, MAX_RECENT_PARSED_TXS);

      const parsedTxs = await solanaConnection.getParsedTxs(
        txInfosAndInteractionIds.map(
          ({ signatureInfo }) => signatureInfo.signature,
        ),
      );

      return Promise.all(
        txInfosAndInteractionIds.map(
          ({ signatureInfo: { blockTime, signature }, interactionId }, i) => {
            const parsedTx = parsedTxs[i];
            return {
              ecosystem: EcosystemId.Solana as const,
              txId: signature,
              timestamp: blockTime ?? null,
              interactionId,
              parsedTx,
            };
          },
        ),
      );
    },
    {
      refetchOnWindowFocus: false, // additionally disable this to save on queries
      enabled: !!address,
    },
  );
};
