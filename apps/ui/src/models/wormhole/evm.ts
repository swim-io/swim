import { getAllowanceEth } from "@certusone/wormhole-sdk";
import { PublicKey } from "@solana/web3.js";
import type { TokenDetails, WormholeChainConfig } from "@swim-io/core";
import type { EvmConnection, EvmTx, EvmWalletAdapter } from "@swim-io/evm";
import { approveEth, transferFromEth } from "@swim-io/wormhole";
import type { ethers } from "ethers";

import type { EvmSpec, TokenConfig } from "../../config";
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

export const approveAmount = async (
  amountAtomicString: string,
  evmChain: EvmSpec,
  evmConnection: EvmConnection,
  fromTokenDetails: TokenDetails,
  evmWallet: EvmWalletAdapter,
  spenderAddress: string,
): Promise<readonly ethers.providers.TransactionResponse[]> => {
  const evmSigner = evmWallet.signer;
  if (!evmSigner) {
    throw new Error("No EVM signer");
  }

  await evmWallet.switchNetwork(evmChain.chainId);

  const allowance = await getAllowanceEth(
    spenderAddress,
    fromTokenDetails.address,
    evmSigner,
  );

  let approvalResponses: readonly ethers.providers.TransactionResponse[] = [];
  if (allowance.lt(amountAtomicString)) {
    if (!allowance.isZero()) {
      // Reset to 0 to avoid a race condition allowing Wormhole to steal funds
      // See https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
      // Note this is required by some ERC20 implementations such as USDT
      // See line 205 here: https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code
      const resetApprovalResponse = await approveEth(
        spenderAddress,
        fromTokenDetails.address,
        evmSigner,
        "0",
      );
      approvalResponses = resetApprovalResponse
        ? [...approvalResponses, resetApprovalResponse]
        : approvalResponses;
    }
    const approvalResponse = await approveEth(
      spenderAddress,
      fromTokenDetails.address,
      evmSigner,
      amountAtomicString,
    );
    approvalResponses = approvalResponse
      ? [...approvalResponses, approvalResponse]
      : approvalResponses;

    // Wait for approvalResponse to be mined, otherwise the transfer might fail ("transfer amount exceeds allowance")
    if (approvalResponse) {
      await evmConnection.getTxReceiptOrThrow(approvalResponse);
    }
  }

  return approvalResponses;
};

export const lockEvmToken = async ({
  interactionId,
  amountAtomicString,
  evmChain,
  evmConnection,
  fromTokenDetails,
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

  const approvalResponses = await approveAmount(
    amountAtomicString,
    evmChain,
    evmConnection,
    fromTokenDetails,
    evmWallet,
    evmChain.wormhole.portal,
  );

  const transferResponse = await transferFromEth(
    interactionId,
    evmChain.wormhole.portal,
    evmSigner,
    fromTokenDetails.address,
    amountAtomicString,
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
