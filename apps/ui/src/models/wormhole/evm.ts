import { getAllowanceEth } from "@certusone/wormhole-sdk";
import { PublicKey } from "@solana/web3.js";
import { SOLANA_WORMHOLE_CHAIN_ID } from "@swim-io/plugin-ecosystem-solana";
import type { ethers } from "ethers";

import type { TokenSpec } from "../../config";
import type { EvmTx } from "../crossEcosystem";

import { approveEth, transferFromEth } from "./overrides";
import type { WormholeTransfer } from "./transfer";

export const isLockEvmTx = (
  wormholeTokenBridge: string,
  token: TokenSpec,
  tx: EvmTx,
): boolean => {
  const evmTokenDetails = token.detailsByEcosystem.get(tx.ecosystem) ?? null;
  if (evmTokenDetails === null) {
    return false;
  }
  if (tx.txResponse.to?.toLowerCase() !== wormholeTokenBridge.toLowerCase()) {
    return false;
  }
  return tx.txReceipt.logs.some(
    (log) =>
      log.address.toLowerCase() === evmTokenDetails.address.toLowerCase(),
  );
};

export const isUnlockEvmTx = (
  wormholeTokenBridge: string,
  token: TokenSpec,
  tx: EvmTx,
): boolean => {
  const evmTokenDetails = token.detailsByEcosystem.get(tx.ecosystem) ?? null;
  if (evmTokenDetails === null) {
    return false;
  }
  if (tx.txReceipt.to.toLowerCase() !== wormholeTokenBridge.toLowerCase()) {
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

  await evmWallet.switchNetwork(evmChain.chainId);

  const transferAmountAtomicString = amount.toAtomicString(
    evmChain.ecosystemId,
  );
  const allowance = await getAllowanceEth(
    evmChain.wormholeTokenBridge,
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
        evmChain.wormholeTokenBridge,
        evmTokenDetails.address,
        evmSigner,
        "0",
      );
      approvalResponses = resetApprovalResponse
        ? [...approvalResponses, resetApprovalResponse]
        : approvalResponses;
    }
    const approvalResponse = await approveEth(
      evmChain.wormholeTokenBridge,
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
    evmChain.wormholeTokenBridge,
    evmSigner,
    evmTokenDetails.address,
    transferAmountAtomicString,
    SOLANA_WORMHOLE_CHAIN_ID,
    new PublicKey(splTokenAccountAddress).toBytes(),
  );

  if (transferResponse === null) {
    throw new Error(
      `Transaction not found (lock/burn from ${evmChain.ecosystemId})`,
    );
  }

  return {
    approvalResponses,
    transferResponse,
  };
};
