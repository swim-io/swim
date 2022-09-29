import type { ChainId } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_SOLANA,
  createNonce,
  getBridgeFeeIx,
  importCoreWasm,
  importTokenWasm,
  ixFromRust,
} from "@certusone/wormhole-sdk";
import { createApproveInstruction } from "@solana/spl-token";
import type {
  ParsedTransactionWithMeta,
  Transaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { SolanaConnection } from "./SolanaConnection";
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
  readonly solanaConnection: SolanaConnection;
  readonly bridgeAddress: string;
  readonly portalAddress: string;
  readonly payerAddress: string;
  readonly auxiliarySignerAddress: string;
  readonly fromAddress: string;
  readonly mintAddress: string;
  readonly amount: bigint;
  readonly targetAddress: Uint8Array;
  readonly targetChain: ChainId;
  readonly originAddress?: Uint8Array;
  readonly originChain?: ChainId;
  readonly fromOwnerAddress?: string;
}
export const createTransferFromSolanaTx = async ({
  interactionId,
  solanaConnection,
  bridgeAddress,
  portalAddress,
  payerAddress,
  auxiliarySignerAddress,
  fromAddress,
  mintAddress,
  amount,
  targetAddress,
  targetChain,
  originAddress,
  originChain,
  fromOwnerAddress,
}: CreateTransferFromSolanaTxParams): Promise<Transaction> => {
  const nonce = createNonce().readUInt32LE(0);
  const fee = BigInt(0); // for now, this won't do anything, we may add later
  const bridgeFeeIx = await getBridgeFeeIx(
    solanaConnection.rawConnection,
    bridgeAddress,
    payerAddress,
  );
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {
    transfer_native_ix,
    transfer_wrapped_ix,
    approval_authority_address,
  } = await importTokenWasm();
  const approvalIx = createApproveInstruction(
    new PublicKey(fromAddress),
    new PublicKey(approval_authority_address(portalAddress)),
    new PublicKey(fromOwnerAddress || payerAddress),
    amount,
  );
  const isSolanaNative =
    originChain === undefined || originChain === CHAIN_ID_SOLANA;
  if (!isSolanaNative && !originAddress) {
    throw new Error("originAddress is required when specifying originChain");
  }
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
          targetChain,
        )
      : transfer_wrapped_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          auxiliarySignerAddress,
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
  }).add(bridgeFeeIx, approvalIx, transferIx, memoIx);
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
  readonly signedVaa: Uint8Array;
}
export const createRedeemOnSolanaTx = async ({
  interactionId,
  bridgeAddress,
  portalAddress,
  payerAddress,
  signedVaa,
}: CreateRedeemOnSolanaTxParams): Promise<Transaction> => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { parse_vaa } = await importCoreWasm();
  const parsedVAA = parse_vaa(signedVaa) as {
    readonly payload: Iterable<number>;
  };
  const isSolanaNative =
    Buffer.from(new Uint8Array(parsedVAA.payload)).readUInt16BE(65) ===
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
          signedVaa,
        ),
      )
    : ixFromRust(
        complete_transfer_wrapped_ix(
          portalAddress,
          bridgeAddress,
          payerAddress,
          signedVaa,
        ),
      );
  const memoIx = createMemoIx(interactionId, []);
  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(completeTransferIx, memoIx);
  return tx;
};
