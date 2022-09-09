/* eslint-disable @typescript-eslint/unbound-method, functional/immutable-data, functional/prefer-readonly-type */
import type { ChainId } from "@certusone/wormhole-sdk";
import {
  Bridge__factory,
  CHAIN_ID_SOLANA,
  ERC20__factory,
  createNonce,
  getBridgeFeeIx,
  importCoreWasm,
  importTokenWasm,
  ixFromRust,
} from "@certusone/wormhole-sdk";
import { createApproveInstruction } from "@solana/spl-token";
import type { Transaction } from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createMemoIx, createTx } from "@swim-io/solana";
import type { SolanaConnection } from "@swim-io/solana";
import type { ethers } from "ethers";

export const approveEth = async (
  tokenBridgeAddress: string,
  tokenAddress: string,
  signer: ethers.Signer,
  amount: ethers.BigNumberish,
): Promise<ethers.providers.TransactionResponse | null> => {
  const token = ERC20__factory.connect(tokenAddress, signer);
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
  solanaConnection: SolanaConnection,
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
