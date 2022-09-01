import {
  chunks,
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
} from "@certusone/wormhole-sdk";
import type {
  Keypair,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  Transaction,
  TransactionInstruction,
  TransactionResponse,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";
import type { SolanaTx } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, createMemoIx } from "@swim-io/solana";

import type { TokenSpec } from "../../config";
import { WormholeChainId, getSolanaTokenDetails } from "../../config";
import type { SolanaConnection } from "../solana";
import {
  createTx,
  getAmountBurnedByMint,
  getAmountMintedToAccount,
  getAmountTransferredFromAccount,
  getAmountTransferredToAccount,
} from "../solana";
import type { SolanaWalletAdapter } from "../wallets";

import {
  DEFAULT_WORMHOLE_RETRIES,
  POLYGON_WORMHOLE_RETRIES,
} from "./constants";
import { getSignedVaaWithRetry } from "./guardiansRpc";
import { postVaaSolanaWithRetry, redeemOnSolana } from "./overrides";

// Adapted from https://github.com/certusone/wormhole/blob/83b97bedb8c54618b191c20e4e18ba438a716cfa/sdk/js/src/bridge/parseSequenceFromLog.ts#L71-L81
const SOLANA_SEQ_LOG = "Program log: Sequence: ";
export const parseSequenceFromLogSolana = (
  tx: ParsedTransactionWithMeta | TransactionResponse,
): string => {
  // TODO: better parsing, safer
  const sequenceLog = tx.meta?.logMessages?.find((msg) =>
    msg.startsWith(SOLANA_SEQ_LOG),
  );
  if (!sequenceLog) {
    throw new Error("sequence not found");
  }
  return sequenceLog.replace(SOLANA_SEQ_LOG, "");
};

export const isLockSplTx = (
  wormholeChainConfig: WormholeChainConfig,
  splTokenAccountAddress: string,
  token: TokenSpec,
  { parsedTx }: SolanaTx,
): boolean => {
  if (
    !parsedTx.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainConfig.portal,
    )
  ) {
    return false;
  }

  return token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID
    ? getAmountTransferredFromAccount(
        parsedTx,
        splTokenAccountAddress,
      ).greaterThan(0)
    : getAmountBurnedByMint(
        parsedTx,
        getSolanaTokenDetails(token).address,
      ).greaterThan(0);
};

export const isPartiallyDecodedInstruction = (
  ix: PartiallyDecodedInstruction | ParsedInstruction,
): ix is PartiallyDecodedInstruction =>
  !!(ix as PartiallyDecodedInstruction).accounts;

export const isPostVaaSolanaTx = (
  wormholeChainConfig: WormholeChainConfig,
  signatureSetAddress: string | null,
  tx: SolanaTx,
): boolean => {
  if (signatureSetAddress === null) {
    return false;
  }
  return tx.parsedTx.transaction.message.instructions.some(
    (ix) =>
      isPartiallyDecodedInstruction(ix) &&
      ix.programId.toBase58() === wormholeChainConfig.bridge &&
      ix.accounts.some((account) => account.toBase58() === signatureSetAddress),
  );
};

export const isRedeemOnSolanaTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenSpec,
  splTokenAccount: string,
  { parsedTx }: SolanaTx,
): boolean => {
  if (
    !parsedTx.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainConfig.portal,
    )
  ) {
    return false;
  }
  return token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID
    ? getAmountTransferredToAccount(parsedTx, splTokenAccount).greaterThan(0)
    : getAmountMintedToAccount(parsedTx, splTokenAccount).greaterThan(0);
};

export async function* generatePostVaaSolanaTxIds(
  interactionId: string,
  solanaConnection: SolanaConnection,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  bridgeId: string,
  payer: string,
  vaa: Buffer,
  signatureSetKeypair: Keypair,
): AsyncGenerator<string> {
  const memoIx = createMemoIx(interactionId, []);
  const ixs: readonly TransactionInstruction[] =
    await createVerifySignaturesInstructionsSolana(
      solanaConnection.rawConnection,
      bridgeId,
      payer,
      vaa,
      signatureSetKeypair,
    );
  const finalIx: TransactionInstruction = await createPostVaaInstructionSolana(
    bridgeId,
    payer,
    vaa,
    signatureSetKeypair,
  );

  // The verify signatures instructions can be batched into groups of 2 safely,
  // reducing the total number of transactions
  const batchableChunks = chunks([...ixs], 2);
  const unsignedTxs = batchableChunks.map((chunk) =>
    createTx({
      feePayer: new PublicKey(payer),
    }).add(...chunk, memoIx),
  );
  // The postVaa instruction can only execute after the verifySignature transactions have
  // successfully completed
  const finalTx = createTx({
    feePayer: new PublicKey(payer),
  }).add(finalIx, memoIx);

  // The signatureSet keypair also needs to sign the verifySignature transactions, thus a wrapper is needed
  const partialSignWrapper = async (tx: Transaction): Promise<Transaction> => {
    tx.partialSign(signatureSetKeypair);
    return signTransaction(tx);
  };

  for (const tx of unsignedTxs) {
    yield await solanaConnection.sendAndConfirmTx(partialSignWrapper, tx);
  }
  yield await solanaConnection.sendAndConfirmTx(signTransaction, finalTx);
}

export async function* generateUnlockSplTokenTxIds(
  interactionId: string,
  wormholeRpcUrls: readonly string[],
  wormholeChainId: WormholeChainId,
  emitterAddress: string,
  sequence: string,
  solanaWormhole: WormholeChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  signatureSetKeypair: Keypair,
): AsyncGenerator<string> {
  const { publicKey: solanaPublicKey } = solanaWallet;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }
  const retries =
    wormholeChainId === WormholeChainId.Polygon
      ? POLYGON_WORMHOLE_RETRIES
      : DEFAULT_WORMHOLE_RETRIES;
  const { vaaBytes } = await getSignedVaaWithRetry(
    [...wormholeRpcUrls],
    wormholeChainId,
    emitterAddress,
    sequence,
    undefined,
    undefined,
    retries,
  );
  const postVaaSolanaTxIdsGenerator = generatePostVaaSolanaTxIds(
    interactionId,
    solanaConnection,
    solanaWallet.signTransaction.bind(solanaWallet),
    solanaWormhole.bridge,
    solanaPublicKey.toBase58(),
    Buffer.from(vaaBytes),
    signatureSetKeypair,
  );
  for await (const txId of postVaaSolanaTxIdsGenerator) {
    yield txId;
  }
  const redeemTx = await redeemOnSolana(
    interactionId,
    solanaConnection,
    solanaWormhole.bridge,
    solanaWormhole.portal,
    solanaPublicKey.toBase58(),
    vaaBytes,
  );
  yield await solanaConnection.sendAndConfirmTx(
    solanaWallet.signTransaction.bind(solanaWallet),
    redeemTx,
  );
}

export const unlockSplToken = async (
  interactionId: string,
  wormholeRpcUrls: readonly string[],
  wormholeChainId: WormholeChainId,
  emitterAddress: string,
  sequence: string,
  solanaWormhole: WormholeChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
): Promise<readonly string[]> => {
  const { publicKey: solanaPublicKey } = solanaWallet;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }
  const retries =
    wormholeChainId === WormholeChainId.Polygon
      ? POLYGON_WORMHOLE_RETRIES
      : DEFAULT_WORMHOLE_RETRIES;
  const { vaaBytes } = await getSignedVaaWithRetry(
    [...wormholeRpcUrls],
    wormholeChainId,
    emitterAddress,
    sequence,
    undefined,
    undefined,
    retries,
  );
  const postVaaTxIds = await postVaaSolanaWithRetry(
    interactionId,
    solanaConnection,
    solanaWallet.signTransaction.bind(solanaWallet),
    solanaWormhole.bridge,
    solanaPublicKey.toBase58(),
    Buffer.from(vaaBytes),
  );
  const tx = await redeemOnSolana(
    interactionId,
    solanaConnection,
    solanaWormhole.bridge,
    solanaWormhole.portal,
    solanaPublicKey.toBase58(),
    vaaBytes,
  );
  const redeemTxId = await solanaConnection.sendAndConfirmTx(
    solanaWallet.signTransaction.bind(solanaWallet),
    tx,
  );
  return [...postVaaTxIds, redeemTxId];
};
