import { getAllowanceEth } from "@certusone/wormhole-sdk";
import { PublicKey } from "@solana/web3.js";
import type { ethers } from "ethers";

import type { TokenSpec, WormholeChainSpec } from "../../config";
import { WormholeChainId } from "../../config";
import type { EvmTx } from "../crossEcosystem";

import { approveEth, redeemOnEth, transferFromEth } from "./overrides";
import type { WormholeTransfer } from "./transfer";

export const isLockEvmTx = (
  wormholeChainSpec: WormholeChainSpec,
  token: TokenSpec,
  tx: EvmTx,
): boolean => {
  const evmTokenDetails = token.detailsByEcosystem.get(tx.ecosystem) ?? null;
  if (evmTokenDetails === null) {
    return false;
  }
  if (
    tx.txResponse.to?.toLowerCase() !==
    wormholeChainSpec.tokenBridge.toLowerCase()
  ) {
    return false;
  }
  return tx.txReceipt.logs.some(
    (log) =>
      log.address.toLowerCase() === evmTokenDetails.address.toLowerCase(),
  );
};

export const isUnlockEvmTx = (
  wormholeChainSpec: WormholeChainSpec,
  token: TokenSpec,
  tx: EvmTx,
): boolean => {
  const evmTokenDetails = token.detailsByEcosystem.get(tx.ecosystem) ?? null;
  if (evmTokenDetails === null) {
    return false;
  }
  if (
    tx.txReceipt.to.toLowerCase() !==
    wormholeChainSpec.tokenBridge.toLowerCase()
  ) {
    return false;
  }
  return tx.txReceipt.logs.some(
    (log) =>
      log.address.toLowerCase() === evmTokenDetails.address.toLowerCase(),
  );
};

export const lockEvmToken = async ({
  interactionId,
  amount,
  evmChain,
  evmConnection,
  fromTokenDetails: evmTokenDetails,
  evmWallet,
  splTokenAccountAddress,
}: WormholeTransfer): Promise<{
  readonly approvalResponses: readonly ethers.providers.TransactionResponse[];
  readonly transferResponse: ethers.providers.TransactionResponse;
}> => {
  const evmSigner = evmWallet.signer;
  if (!evmSigner) {
    throw new Error("No EVM signer");
  }

  await evmWallet.switchNetwork();

  const transferAmountAtomicString = amount.toAtomicString(evmChain.ecosystem);
  const allowance = await getAllowanceEth(
    evmChain.wormhole.tokenBridge,
    evmTokenDetails.address,
    evmSigner,
  );

  let approvalResponses: readonly ethers.providers.TransactionResponse[] = [];
  if (allowance.lt(transferAmountAtomicString)) {
    if (!allowance.isZero()) {
      // Reset to 0 to avoid a race condition allowing Wormhole to steal funds
      // See https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
      // Note this is required by some ERC20 implementations such as USDT
      // See line 205 here: https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code
      const resetApprovalResponse = await approveEth(
        evmChain.wormhole.tokenBridge,
        evmTokenDetails.address,
        evmSigner,
        "0",
      );
      approvalResponses = resetApprovalResponse
        ? [...approvalResponses, resetApprovalResponse]
        : approvalResponses;
    }
    const approvalResponse = await approveEth(
      evmChain.wormhole.tokenBridge,
      evmTokenDetails.address,
      evmSigner,
      transferAmountAtomicString,
    );
    approvalResponses = approvalResponse
      ? [...approvalResponses, approvalResponse]
      : approvalResponses;

    // Wait for approvalResponse to be mined, otherwise the transfer might fail ("transfer amount exceeds allowance")
    if (approvalResponse) {
      await evmConnection.getTxReceiptOrThrow(approvalResponse);
    }
  }

  const transferResponse = await transferFromEth(
    interactionId,
    evmChain.wormhole.tokenBridge,
    evmSigner,
    evmTokenDetails.address,
    transferAmountAtomicString,
    WormholeChainId.Solana,
    new PublicKey(splTokenAccountAddress).toBytes(),
  );

  if (transferResponse === null) {
    throw new Error(
      `Transaction not found (lock/burn from ${evmChain.ecosystem})`,
    );
  }

  return {
    approvalResponses,
    transferResponse,
  };
};

export const unlockEvmToken = async (
  transfer: WormholeTransfer,
  vaaBytes: Uint8Array,
): Promise<ethers.providers.TransactionResponse> => {
  const { interactionId, evmChain, evmWallet } = transfer;
  const evmSigner = evmWallet.signer;
  if (evmSigner === null) {
    throw new Error("Missing EVM signer");
  }

  await evmWallet.switchNetwork();

  const redeemResponse = await redeemOnEth(
    interactionId,
    evmChain.wormhole.tokenBridge,
    evmSigner,
    vaaBytes,
  );

  if (redeemResponse === null) {
    throw new Error(
      `Transaction not found: (unlock/mint on ${evmChain.ecosystem})`,
    );
  }

  return redeemResponse;
};
