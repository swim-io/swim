import type { ConfirmedSignatureInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import { EcosystemId, Env } from "../../config";
import type { SolanaTx } from "../crossEcosystem";
import { INTERACTION_ID_LENGTH_HEX } from "../utils";

import type { SolanaConnection } from "./SolanaConnection";

const MAX_RECENT_SIGNATURES = 1000;
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

export const fetchSolanaTxsForInteractionId = async (
  interactionId: string,
  env: Env,
  solanaConnection: SolanaConnection,
  solanaAddress: string,
): Promise<readonly SolanaTx[]> => {
  // fetch all transaction signatures first, this can easily be 1000 txs but it counts as one RPC call
  const txInfos = await solanaConnection.getSignaturesForAddress(
    new PublicKey(solanaAddress),
    {
      limit: MAX_RECENT_SIGNATURES, // 1-1000, default = 1000
    },
  );

  const txInfosAndInteractionIds = (
    await Promise.all(
      txInfos.map((txInfo) =>
        addSolanaInteractionId(solanaConnection, env, txInfo),
      ),
    )
  ).filter((txInfo) => txInfo.interactionId === interactionId);

  const parsedTxs = await solanaConnection.getParsedTxs(
    txInfosAndInteractionIds.map(
      ({ signatureInfo }) => signatureInfo.signature,
    ),
  );

  return txInfosAndInteractionIds.map(
    ({ signatureInfo: { blockTime, signature } }, index) => ({
      ecosystem: EcosystemId.Solana as const,
      txId: signature,
      timestamp: blockTime ?? null,
      interactionId,
      parsedTx: parsedTxs[index],
    }),
  );
};
