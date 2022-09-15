/* eslint-disable @typescript-eslint/unbound-method, functional/immutable-data, functional/prefer-readonly-type */
import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_SOLANA,
  chunks,
  createNonce,
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
  getBridgeFeeIx,
  importCoreWasm,
  importTokenWasm,
  ixFromRust,
} from "@certusone/wormhole-sdk";
import { createApproveInstruction } from "@solana/spl-token";
import type {
  ParsedTransactionWithMeta,
  Transaction,
  TransactionInstruction,
  TransactionResponse,
} from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";

import type { SolanaConnection } from "./SolanaConnection";
import { createMemoIx, createTx } from "./utils";
import type { SolanaWalletAdapter } from "./walletAdapters";

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

/**
 * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/token_bridge/transfer.ts#L264-L341
 */
export const transferFromSolana = async (
  interactionId: string,
  solanaConnection: SolanaConnection,
  bridgeAddress: string,
  tokenBridgeAddress: string,
  payerAddress: string,
  fromAddress: string,
  mintAddress: string,
  amount: bigint,
  targetAddress: Uint8Array,
  targetChain: ChainId,
  originAddress?: Uint8Array,
  originChain?: ChainId,
  fromOwnerAddress?: string,
): Promise<{ readonly tx: Transaction; readonly messageKeypair: Keypair }> => {
  const nonce = createNonce().readUInt32LE(0);
  const fee = BigInt(0); // for now, this won't do anything, we may add later
  const transferIx = await getBridgeFeeIx(
    solanaConnection.rawConnection,
    bridgeAddress,
    payerAddress,
  );
  const {
    transfer_native_ix,
    transfer_wrapped_ix,
    approval_authority_address,
  } = await importTokenWasm();
  const approvalIx = createApproveInstruction(
    new PublicKey(fromAddress),
    new PublicKey(approval_authority_address(tokenBridgeAddress)),
    new PublicKey(fromOwnerAddress || payerAddress),
    amount,
  );
  const messageKeypair = Keypair.generate();
  const isSolanaNative =
    originChain === undefined || originChain === CHAIN_ID_SOLANA;
  if (!isSolanaNative && !originAddress) {
    throw new Error("originAddress is required when specifying originChain");
  }
  const ix = ixFromRust(
    isSolanaNative
      ? transfer_native_ix(
          tokenBridgeAddress,
          bridgeAddress,
          payerAddress,
          messageKeypair.publicKey.toString(),
          fromAddress,
          mintAddress,
          nonce,
          amount,
          fee,
          targetAddress,
          targetChain,
        )
      : transfer_wrapped_ix(
          tokenBridgeAddress,
          bridgeAddress,
          payerAddress,
          messageKeypair.publicKey.toString(),
          fromAddress,
          fromOwnerAddress || payerAddress,
          originChain as number, // checked by isSolanaNative
          originAddress as Uint8Array, // checked by throw
          nonce,
          amount,
          fee,
          targetAddress,
          targetChain,
        ),
  );
  const memoIx = createMemoIx(interactionId, []);

  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(transferIx, approvalIx, ix, memoIx);
  return { tx, messageKeypair };
};

/**
 * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/token_bridge/redeem.ts#L146-L189
 * */
export const redeemOnSolana = async (
  interactionId: string,
  bridgeAddress: string,
  tokenBridgeAddress: string,
  payerAddress: string,
  signedVAA: Uint8Array,
): Promise<Transaction> => {
  const { parse_vaa } = await importCoreWasm();
  const parsedVAA = parse_vaa(signedVAA) as {
    payload: Iterable<number>;
  };
  const isSolanaNative =
    Buffer.from(new Uint8Array(parsedVAA.payload)).readUInt16BE(65) ===
    CHAIN_ID_SOLANA;
  const { complete_transfer_wrapped_ix, complete_transfer_native_ix } =
    await importTokenWasm();
  const ixs = [];
  if (isSolanaNative) {
    ixs.push(
      ixFromRust(
        complete_transfer_native_ix(
          tokenBridgeAddress,
          bridgeAddress,
          payerAddress,
          signedVAA,
        ),
      ),
    );
  } else {
    ixs.push(
      ixFromRust(
        complete_transfer_wrapped_ix(
          tokenBridgeAddress,
          bridgeAddress,
          payerAddress,
          signedVAA,
        ),
      ),
    );
  }
  const memoIx = createMemoIx(interactionId, []);
  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(...ixs, memoIx);
  return tx;
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
  solanaWormhole: WormholeChainConfig,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter,
  signatureSetKeypair: Keypair,
  vaaBytes: Uint8Array,
): AsyncGenerator<string> {
  const { publicKey: solanaPublicKey } = solanaWallet;
  if (!solanaPublicKey) {
    throw new Error("No Solana public key");
  }
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
    solanaWormhole.portal,
    solanaPublicKey.toBase58(),
    vaaBytes,
  );
  yield await solanaConnection.sendAndConfirmTx(
    solanaWallet.signTransaction.bind(solanaWallet),
    redeemTx,
  );
}
