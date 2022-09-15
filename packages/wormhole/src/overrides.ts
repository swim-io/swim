import type { ChainId } from "@certusone/wormhole-sdk";
import {
  Bridge__factory,
  ERC20__factory,
  createNonce,
} from "@certusone/wormhole-sdk";
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
