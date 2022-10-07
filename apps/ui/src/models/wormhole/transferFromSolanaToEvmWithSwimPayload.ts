/* eslint-disable @typescript-eslint/unbound-method */
import type { ChainId } from "@certusone/wormhole-sdk";
import {
  createNonce,
  getBridgeFeeIx,
  importTokenWasm,
  ixFromRust,
} from "@certusone/wormhole-sdk";
import { createApproveInstruction } from "@solana/spl-token";
import type { Transaction } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { SolanaClient } from "@swim-io/solana";
import { createMemoIx, createTx } from "@swim-io/solana";

export const transferFromSolanaToEvmWithSwimPayload = async (
  interactionId: string,
  solanaClient: SolanaClient,
  bridgeAddress: string,
  tokenBridgeAddress: string,
  payerAddress: string,
  fromAddress: string,
  mintAddress: string,
  amount: bigint,
  routingContractAddress: Uint8Array,
  targetAddress: Uint8Array,
  targetChain: ChainId,
): Promise<{ readonly tx: Transaction; readonly messageKeypair: Keypair }> => {
  const nonce = createNonce().readUInt32LE(0);
  const transferIx = await getBridgeFeeIx(
    solanaClient.connection,
    bridgeAddress,
    payerAddress,
  );
  const { transfer_native_with_payload_ix, approval_authority_address } =
    await importTokenWasm();
  const approvalIx = createApproveInstruction(
    new PublicKey(fromAddress),
    new PublicKey(approval_authority_address(tokenBridgeAddress)),
    new PublicKey(payerAddress),
    amount,
  );
  const messageKeypair = Keypair.generate();
  const swimPayload = Uint8Array.from([
    ...Buffer.alloc(1).fill(1), // version
    ...targetAddress, // leftpadded targetAddress
  ]);
  const ix = ixFromRust(
    transfer_native_with_payload_ix(
      tokenBridgeAddress,
      bridgeAddress,
      payerAddress,
      messageKeypair.publicKey.toString(),
      fromAddress,
      mintAddress,
      nonce,
      amount,
      routingContractAddress,
      targetChain,
      swimPayload,
    ),
  );
  const memoIx = createMemoIx(interactionId, []);

  const tx = createTx({
    feePayer: new PublicKey(payerAddress),
  }).add(transferIx, approvalIx, ix, memoIx);
  return { tx, messageKeypair };
};
