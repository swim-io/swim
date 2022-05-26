/* eslint-disable functional/immutable-data, functional/prefer-readonly-type */
import type { ChainId } from "@certusone/wormhole-sdk";
import {
  Bridge__factory,
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
import { TOKEN_PROGRAM_ID, Token, u64 } from "@solana/spl-token";
import type { TransactionInstruction } from "@solana/web3.js";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import type { ethers } from "ethers";

import { Erc20Factory } from "../evm";
import type { SolanaConnection } from "../solana";
import { createMemoIx } from "../solana";

export const approveEth = async (
  tokenBridgeAddress: string,
  tokenAddress: string,
  signer: ethers.Signer,
  amount: ethers.BigNumberish,
): Promise<ethers.providers.TransactionResponse | null> => {
  const token = Erc20Factory.connect(tokenAddress, signer);
  return token.approve(tokenBridgeAddress, amount);
};

/**
 * The Wormhole EVM token bridge contract does not offer memo logging, meaning we would need a separate smart contract to implement that. However, because the token bridge contract relies on msg.sender we cannot simply log and forward the call data, meaning we would essentially have to rewrite the whole contract ourselves. Thus we store the ID at the end of the call data where it has no effect on the smart contract functionality and can be retrieved later.
 */
const appendInteractionIdToEvmTxData = (
  interactionId: string,
  populatedTx: ethers.PopulatedTransaction,
): ethers.PopulatedTransaction => ({
  ...populatedTx,
  data: populatedTx.data
    ? `${populatedTx.data}${interactionId}`
    : `0x${interactionId}`,
});

/**
 * Adapted from https://github.com/certusone/wormhole/blob/07446e2e23e51d98822182a77ad802b5d10f120a/sdk/js/src/token_bridge/transfer.ts#L42-L62
 */
export const transferFromEth = async (
  interactionId: string,
  tokenBridgeAddress: string,
  signer: ethers.Signer,
  tokenAddress: string,
  amount: ethers.BigNumberish,
  recipientChain: ChainId,
  recipientAddress: Uint8Array,
): Promise<ethers.providers.TransactionResponse | null> => {
  const fee = 0; // for now, this won't do anything, we may add later
  const bridge = Bridge__factory.connect(tokenBridgeAddress, signer);
  const populatedTx = await bridge.populateTransaction.transferTokens(
    tokenAddress,
    amount,
    recipientChain,
    recipientAddress,
    fee,
    createNonce(),
  );
  const txRequest = appendInteractionIdToEvmTxData(interactionId, populatedTx);
  return signer.sendTransaction(txRequest);
};

/**
 * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/token_bridge/redeem.ts#L24-L33
 */
export const redeemOnEth = async (
  interactionId: string,
  tokenBridgeAddress: string,
  signer: ethers.Signer,
  signedVAA: Uint8Array,
): Promise<ethers.providers.TransactionResponse | null> => {
  const bridge = Bridge__factory.connect(tokenBridgeAddress, signer);
  const populatedTx = await bridge.populateTransaction.completeTransfer(
    signedVAA,
  );
  const txRequest = appendInteractionIdToEvmTxData(interactionId, populatedTx);
  return signer.sendTransaction(txRequest);
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
  const approvalIx = Token.createApproveInstruction(
    TOKEN_PROGRAM_ID,
    new PublicKey(fromAddress),
    new PublicKey(approval_authority_address(tokenBridgeAddress)),
    new PublicKey(fromOwnerAddress || payerAddress),
    [],
    new u64(amount.toString(16), 16),
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
  const tx = new Transaction({ feePayer: new PublicKey(payerAddress) }).add(
    transferIx,
    approvalIx,
    ix,
    memoIx,
  );
  return { tx, messageKeypair };
};

/**
 * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/solana/postVaa.ts#L13-L80
 */
export const postVaaSolanaWithRetry = async (
  interactionId: string,
  solanaConnection: SolanaConnection,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  bridge_id: string,
  payer: string,
  vaa: Buffer,
): Promise<readonly string[]> => {
  const memoIx = createMemoIx(interactionId, []);

  const unsignedTxs: Transaction[] = [];
  const signatureSet = Keypair.generate();
  // const { createPostVaaInstruction, createVerifySignaturesInstructions } =
  //   await importInstructionCreators();
  const ixs: readonly TransactionInstruction[] =
    await createVerifySignaturesInstructionsSolana(
      solanaConnection.rawConnection,
      bridge_id,
      payer,
      vaa,
      signatureSet,
    );
  const finalIx: TransactionInstruction = await createPostVaaInstructionSolana(
    bridge_id,
    payer,
    vaa,
    signatureSet,
  );

  // The verify signatures instructions can be batched into groups of 2 safely,
  // reducing the total number of transactions.
  const batchableChunks = chunks([...ixs], 2);
  batchableChunks.forEach((chunk) => {
    const tx = new Transaction({ feePayer: new PublicKey(payer) }).add(
      ...chunk,
      memoIx,
    );
    unsignedTxs.push(tx);
  });

  // The postVaa instruction can only execute after the verifySignature transactions have
  // successfully completed.
  const finalTx = new Transaction({ feePayer: new PublicKey(payer) }).add(
    finalIx,
    memoIx,
  );

  // The signatureSet keypair also needs to sign the verifySignature transactions, thus a wrapper is needed.
  const partialSignWrapper = async (tx: Transaction): Promise<Transaction> => {
    tx.partialSign(signatureSet);
    return signTransaction(tx);
  };

  const txIds = await solanaConnection.sendAndConfirmTxs(
    partialSignWrapper,
    unsignedTxs,
  );
  // While the signatureSet is used to create the final instruction, it doesn't need to sign it.
  const finalTxIds = await solanaConnection.sendAndConfirmTxs(signTransaction, [
    finalTx,
  ]);

  return Promise.resolve([...txIds, ...finalTxIds]);
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
  const parsedVAA = parse_vaa(signedVAA);
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
  const tx = new Transaction({ feePayer: new PublicKey(payerAddress) }).add(
    ...ixs,
    memoIx,
  );
  return tx;
};
