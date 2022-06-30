import {
  chunks,
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
  getEmitterAddressSolana,
  getSignedVAAWithRetry,
} from "@certusone/wormhole-sdk";
import type {
  Keypair,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  TransactionInstruction,
  TransactionResponse,
} from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";

import type { TokenSpec, WormholeChainSpec } from "../../config";
import {
  ECOSYSTEMS,
  EcosystemId,
  WormholeChainId,
  getSolanaTokenDetails,
} from "../../config";
import type { SolanaTx, Tx } from "../crossEcosystem";
import { isSolanaTx } from "../crossEcosystem";
import type { SolanaConnection } from "../solana";
import {
  createMemoIx,
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
import {
  postVaaSolanaWithRetry,
  redeemOnSolana,
  transferFromSolana,
} from "./overrides";
import type { WormholeTransfer } from "./transfer";
import { evmAddressToWormhole } from "./utils";

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
  wormholeChainSpec: WormholeChainSpec,
  splTokenAccountAddress: string,
  token: TokenSpec,
  { parsedTx }: SolanaTx,
): boolean => {
  if (
    !parsedTx.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainSpec.tokenBridge,
    )
  ) {
    return false;
  }

  return token.nativeEcosystem === EcosystemId.Solana
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
  wormholeChainSpec: WormholeChainSpec,
  signatureSetAddress: string | null,
  tx: SolanaTx,
): boolean => {
  if (signatureSetAddress === null) {
    return false;
  }
  return tx.parsedTx.transaction.message.instructions.some(
    (ix) =>
      isPartiallyDecodedInstruction(ix) &&
      ix.programId.toBase58() === wormholeChainSpec.bridge &&
      ix.accounts.some((account) => account.toBase58() === signatureSetAddress),
  );
};

export const isRedeemOnSolanaTx = (
  wormholeChainSpec: WormholeChainSpec,
  token: TokenSpec,
  splTokenAccount: string,
  { parsedTx }: SolanaTx,
): boolean => {
  if (
    !parsedTx.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainSpec.tokenBridge,
    )
  ) {
    return false;
  }
  return token.nativeEcosystem === EcosystemId.Solana
    ? getAmountTransferredToAccount(parsedTx, splTokenAccount).greaterThan(0)
    : getAmountMintedToAccount(parsedTx, splTokenAccount).greaterThan(0);
};

export const isUnlockSplTx = (
  wormholeChainSpec: WormholeChainSpec,
  token: TokenSpec,
  signatureSetAddress: string | null,
  splTokenAccount: string,
  tx: SolanaTx,
): boolean =>
  isPostVaaSolanaTx(wormholeChainSpec, signatureSetAddress, tx) ||
  isRedeemOnSolanaTx(wormholeChainSpec, token, splTokenAccount, tx);

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
    new Transaction({ feePayer: new PublicKey(payer) }).add(...chunk, memoIx),
  );
  // The postVaa instruction can only execute after the verifySignature transactions have
  // successfully completed
  const finalTx = new Transaction({ feePayer: new PublicKey(payer) }).add(
    finalIx,
    memoIx,
  );

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
  wormholeEndpoint: string,
  wormholeChainId: WormholeChainId,
  emitterAddress: string,
  sequence: string,
  solanaWormhole: WormholeChainSpec,
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
  const { vaaBytes } = await getSignedVAAWithRetry(
    [wormholeEndpoint],
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
    solanaWormhole.bridge,
    solanaWormhole.tokenBridge,
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
  wormholeEndpoint: string,
  wormholeChainId: WormholeChainId,
  emitterAddress: string,
  sequence: string,
  solanaWormhole: WormholeChainSpec,
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
  const { vaaBytes } = await getSignedVAAWithRetry(
    [wormholeEndpoint],
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
    solanaWormhole.bridge,
    solanaWormhole.tokenBridge,
    solanaPublicKey.toBase58(),
    vaaBytes,
  );
  const redeemTxId = await solanaConnection.sendAndConfirmTx(
    solanaWallet.signTransaction.bind(solanaWallet),
    tx,
  );
  return [...postVaaTxIds, redeemTxId];
};

export async function* generateLockSplTokensTxs(
  solanaWormhole: WormholeChainSpec,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransfer[],
): AsyncGenerator<SolanaTx> {
  const { publicKey: solanaPublicKey } = solanaWallet;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }

  // Perform these in series so we can keep track of errors
  for (const {
    interactionId,
    amount,
    evmChain,
    evmWallet,
    fromTokenDetails,
    splTokenAccountAddress,
    token,
    existingTxs,
  } of transfers) {
    if (!evmWallet.address) {
      throw new Error("Missing EVM address");
    }
    const evmEcosystem = ECOSYSTEMS[evmChain.ecosystem];
    const existingTx =
      existingTxs.find<SolanaTx>(
        (tx: Tx): tx is SolanaTx =>
          isSolanaTx(tx) &&
          isLockSplTx(solanaWormhole, splTokenAccountAddress, token, tx),
      ) ?? null;
    if (existingTx !== null) {
      yield existingTx;
      continue;
    }
    const { tx, messageKeypair } = await transferFromSolana(
      interactionId,
      solanaConnection,
      solanaWormhole.bridge,
      solanaWormhole.tokenBridge,
      solanaPublicKey.toBase58(),
      splTokenAccountAddress,
      fromTokenDetails.address,
      BigInt(amount.toAtomicString(EcosystemId.Solana)),
      evmAddressToWormhole(evmWallet.address),
      evmEcosystem.wormholeChainId,
      token.nativeEcosystem === evmChain.ecosystem
        ? evmAddressToWormhole(
            token.detailsByEcosystem.get(evmChain.ecosystem)?.address ?? "",
          )
        : undefined,
      token.nativeEcosystem === evmChain.ecosystem
        ? evmEcosystem.wormholeChainId
        : undefined,
    );
    const signTransaction = async (
      txToSign: Transaction,
    ): Promise<Transaction> => {
      txToSign.partialSign(messageKeypair);
      return solanaWallet.signTransaction(txToSign);
    };
    const txId = await solanaConnection.sendAndConfirmTx(signTransaction, tx);
    const parsedTx = await solanaConnection.getParsedTx(txId);
    yield {
      ecosystem: EcosystemId.Solana,
      txId,
      timestamp: parsedTx.blockTime ?? null,
      interactionId,
      parsedTx,
    };
  }
}

export const lockSplTokens = async (
  wormholeEndpoint: string,
  solanaWormhole: WormholeChainSpec,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  transfers: readonly WormholeTransfer[],
): Promise<
  readonly {
    readonly txId: string;
    readonly vaaBytes: Uint8Array;
  }[]
> => {
  if (!solanaWallet.publicKey) {
    throw new Error("Missing Solana public key");
  }

  // Perform these in series so we can keep track of errors
  let txIds: readonly string[] = [];
  for (const {
    interactionId,
    amount,
    evmChain,
    evmWallet,
    fromTokenDetails,
    splTokenAccountAddress,
    token,
  } of transfers) {
    if (!evmWallet.address) {
      throw new Error("Missing EVM address");
    }
    const evmEcosystem = ECOSYSTEMS[evmChain.ecosystem];
    const { tx, messageKeypair } = await transferFromSolana(
      interactionId,
      solanaConnection,
      solanaWormhole.bridge,
      solanaWormhole.tokenBridge,
      solanaWallet.publicKey.toBase58(),
      splTokenAccountAddress,
      fromTokenDetails.address,
      BigInt(amount.toAtomicString(EcosystemId.Solana)),
      evmAddressToWormhole(evmWallet.address),
      evmEcosystem.wormholeChainId,
      token.nativeEcosystem === evmChain.ecosystem
        ? evmAddressToWormhole(
            token.detailsByEcosystem.get(evmChain.ecosystem)?.address ?? "",
          )
        : undefined,
      token.nativeEcosystem === evmChain.ecosystem
        ? evmEcosystem.wormholeChainId
        : undefined,
    );
    const signTransaction = async (
      txToSign: Transaction,
    ): Promise<Transaction> => {
      txToSign.partialSign(messageKeypair);
      return solanaWallet.signTransaction(txToSign);
    };
    const txId = await solanaConnection.sendAndConfirmTx(signTransaction, tx);
    txIds = [...txIds, txId];
  }

  const txInfos = await Promise.all(
    txIds.map((txId) => solanaConnection.getTx(txId)),
  );
  const sequences = txInfos.map(parseSequenceFromLogSolana);
  const emitterAddress = await getEmitterAddressSolana(
    solanaWormhole.tokenBridge,
  );
  const vaaBytesResponses = await Promise.all(
    sequences.map((sequence) =>
      getSignedVAAWithRetry(
        [wormholeEndpoint],
        WormholeChainId.Solana,
        emitterAddress,
        sequence,
        undefined,
        undefined,
        DEFAULT_WORMHOLE_RETRIES,
      ),
    ),
  );
  return txIds.map((txId, i) => ({
    txId,
    vaaBytes: vaaBytesResponses[i].vaaBytes,
  }));
};
