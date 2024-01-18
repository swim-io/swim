import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_SOLANA,
  createNonce,
  createPostVaaInstructionSolana,
  getBridgeFeeIx,
  importCoreWasm,
  importTokenWasm,
  ixFromRust,
} from "@certusone/wormhole-sdk";
import { createApproveInstruction } from "@solana/spl-token";
import type {
  Connection,
  Keypair,
  ParsedTransactionWithMeta,
  Transaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { WrappedTokenInfo } from "@swim-io/core";

import { createMemoIx, createTx } from "./utils";

// Adapted from https://github.com/certusone/wormhole/blob/83b97bedb8c54618b191c20e4e18ba438a716cfa/sdk/js/src/bridge/parseSequenceFromLog.ts#L71-L81
const SOLANA_SEQ_LOG = "Program log: Sequence: ";
export const parseSequenceFromLogSolana = (
  tx: ParsedTransactionWithMeta | VersionedTransactionResponse,
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
export interface CreateTransferFromSolanaTxParams {
  readonly interactionId: string;
  readonly connection: Connection;
  readonly bridgeAddress: string;
  readonly portalAddress: string;
  readonly payerAddress: string;
  readonly auxiliarySignerAddress: string;
  readonly fromAddress: string;
  readonly mintAddress: string;
  readonly amount: bigint;
  readonly targetAddress: Uint8Array;
  readonly targetChainId: ChainId;
  readonly wrappedTokenInfo?: WrappedTokenInfo;
  readonly fromOwnerAddress?: string;
}
export const createTransferFromSolanaTx = async ({
  interactionId,
  connection,
  bridgeAddress,
  portalAddress,
  payerAddress,
  auxiliarySignerAddress,
  fromAddress,
  mintAddress,
  amount,
  targetAddress,
  targetChainId,
  wrappedTokenInfo,
  fromOwnerAddress,
}: CreateTransferFromSolanaTxParams): Promise<Transaction> => {
  const nonce = createNonce().readUInt32LE(0);
  const fee = BigInt(0); // not currently used
  const bridgeFeeIx = await getBridgeFeeIx(
    connection,
    bridgeAddress,
    payerAddress,
  );

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {
    approval_authority_address,
    transfer_native_ix,
    transfer_wrapped_ix,
  } = await importTokenWasm();
  const approvalIx = createApproveInstruction(
    new PublicKey(fromAddress),
    new PublicKey(approval_authority_address(portalAddress)),
    new PublicKey(fromOwnerAddress ?? payerAddress),
    amount,
  );
  const isSolanaNative =
    wrappedTokenInfo === undefined ||
    wrappedTokenInfo.originChainId === CHAIN_ID_SOLANA;
  const transferIx = ixFromRust(
    isSolanaNative
      ? transfer_native_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          auxiliarySignerAddress,
          fromAddress,
          mintAddress,
          nonce,
          amount,
          fee,
          targetAddress,
          targetChainId,
        )
      : transfer_wrapped_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          auxiliarySignerAddress,
          fromAddress,
          fromOwnerAddress || payerAddress,
          wrappedTokenInfo.originChainId,
          wrappedTokenInfo.originAddress,
          nonce,
          amount,
          fee,
          targetAddress,
          targetChainId,
        ),
  );

  const memoIx = createMemoIx(interactionId, []);
  return createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(bridgeFeeIx, approvalIx, transferIx, memoIx);
};

export interface CreatePostVaaTxParams {
  readonly interactionId: string;
  readonly bridgeAddress: string;
  readonly payerAddress: string;
  readonly vaa: Uint8Array;
  readonly auxiliarySigner: Keypair;
}
export const createPostVaaTx = async ({
  interactionId,
  bridgeAddress,
  payerAddress,
  vaa,
  auxiliarySigner,
}: CreatePostVaaTxParams): Promise<Transaction> => {
  const postVaaIx = await createPostVaaInstructionSolana(
    bridgeAddress,
    payerAddress,
    Buffer.from(vaa),
    auxiliarySigner,
  );
  const memoIx = createMemoIx(interactionId, []);
  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(postVaaIx, memoIx);
  return tx;
};

/**
 * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/token_bridge/redeem.ts#L146-L189
 * */
export interface CreateRedeemOnSolanaTxParams {
  readonly interactionId: string;
  readonly bridgeAddress: string;
  readonly portalAddress: string;
  readonly payerAddress: string;
  readonly vaa: Uint8Array;
}
export const createRedeemOnSolanaTx = async ({
  interactionId,
  bridgeAddress,
  portalAddress,
  payerAddress,
  vaa,
}: CreateRedeemOnSolanaTxParams): Promise<Transaction> => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { parse_vaa } = await importCoreWasm();
  const parsedVaa = parse_vaa(vaa) as {
    readonly payload: Iterable<number>;
  };
  const isSolanaNative =
    Buffer.from(new Uint8Array(parsedVaa.payload)).readUInt16BE(65) ===
    CHAIN_ID_SOLANA;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { complete_transfer_wrapped_ix, complete_transfer_native_ix } =
    await importTokenWasm();
  const completeTransferIx = isSolanaNative
    ? ixFromRust(
        complete_transfer_native_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          vaa,
        ),
      )
    : ixFromRust(
        complete_transfer_wrapped_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          vaa,
        ),
      );
  const memoIx = createMemoIx(interactionId, []);
  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(completeTransferIx, memoIx);
  return tx;
};
