import { getAllowanceEth } from "@certusone/wormhole-sdk";
import { PublicKey } from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";
import type { EvmTx } from "@swim-io/evm";
import { approveEth, transferFromEth } from "@swim-io/wormhole";
import type { ethers } from "ethers";

import type { TokenConfig } from "../../config";
import { WormholeChainId, getTokenDetailsForEcosystem } from "../../config";

import type { WormholeTransfer } from "./transfer";

export const isLockEvmTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenConfig,
  tx: EvmTx,
): boolean => {
  const tokenDetails = getTokenDetailsForEcosystem(token, tx.ecosystemId);
  if (tokenDetails === null) {
    return false;
  }
  if (
    tx.response.to?.toLowerCase() !== wormholeChainConfig.portal.toLowerCase()
  ) {
    return false;
  }
  return tx.receipt.logs.some(
    (log) => log.address.toLowerCase() === tokenDetails.address.toLowerCase(),
  );
};

export const isUnlockEvmTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenConfig,
  tx: EvmTx,
): boolean => {
  const tokenDetails = getTokenDetailsForEcosystem(token, tx.ecosystemId);
  if (tokenDetails === null) {
    return false;
  }
  if (
    tx.receipt.to.toLowerCase() !== wormholeChainConfig.portal.toLowerCase()
  ) {
    return false;
  }
  return tx.receipt.logs.some(
    (log) => log.address.toLowerCase() === tokenDetails.address.toLowerCase(),
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

  const transferAmountAtomicString = amount.toAtomicString(evmChain.ecosystem);
  const allowance = await getAllowanceEth(
    evmChain.wormhole.portal,
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
        evmChain.wormhole.portal,
        evmTokenDetails.address,
        evmSigner,
        "0",
      );
      approvalResponses = resetApprovalResponse
        ? [...approvalResponses, resetApprovalResponse]
        : approvalResponses;
    }
    const approvalResponse = await approveEth(
      evmChain.wormhole.portal,
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
    evmChain.wormhole.portal,
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
