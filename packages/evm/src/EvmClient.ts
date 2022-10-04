import type { ChainId } from "@certusone/wormhole-sdk";
import {
  Bridge__factory,
  createNonce,
  getAllowanceEth,
} from "@certusone/wormhole-sdk";
import type {
  Client,
  CompleteWormholeTransferParams,
  InitiateWormholeTransferParams,
} from "@swim-io/core";
import { getTokenDetails } from "@swim-io/core";
import { ERC20__factory } from "@swim-io/evm-contracts";
import { isNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ethers, providers } from "ethers";
import { utils as ethersUtils } from "ethers";

import type { EvmChainConfig } from "./protocol";
import { appendHexDataToEvmTx } from "./utils";
import type { EvmWalletAdapter } from "./walletAdapters";

type BaseProvider = providers.BaseProvider;
type TransactionReceipt = providers.TransactionReceipt;
type TransactionResponse = providers.TransactionResponse;

export type GetHistoryProvider = BaseProvider & {
  readonly getHistory: (
    address: string,
    startBlock?: number,
    endBlock?: number,
  ) => Promise<readonly TransactionResponse[]>;
};

interface ApproveErc20TokenParams {
  readonly atomicAmount: ethers.BigNumberish;
  readonly signer: ethers.Signer;
  readonly mintAddress: string;
  readonly spenderAddress: string;
}

export interface ApproveTokenAmountParams {
  readonly atomicAmount: string;
  readonly mintAddress: string;
  readonly spenderAddress: string;
  readonly wallet: EvmWalletAdapter;
}

export interface TransferTokenParams {
  readonly atomicAmount: ethers.BigNumberish;
  readonly interactionId: string;
  readonly mintAddress: string;
  readonly targetAddress: Uint8Array;
  readonly targetChainId: ChainId;
  readonly wallet: EvmWalletAdapter;
}

export class EvmClient implements Client<EvmWalletAdapter> {
  public provider: GetHistoryProvider;
  private readonly chainConfig: EvmChainConfig;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txReceiptCache: Map<string, TransactionReceipt>;

  public constructor(
    provider: GetHistoryProvider,
    chainConfig: EvmChainConfig,
  ) {
    this.provider = provider;
    this.chainConfig = chainConfig;
    this.txReceiptCache = new Map();
  }

  public async getHistory(
    address: string,
  ): Promise<readonly TransactionResponse[] | null> {
    // NOTE: ethers does not use strict mode so we widen the type here
    const history = (await this.provider.getHistory(address)) as
      | readonly (TransactionResponse | null)[]
      | null;
    return history?.filter(isNotNull) ?? null;
  }

  public async getTxReceipt(
    txResponse: TransactionResponse | null,
  ): Promise<TransactionReceipt | null> {
    if (!txResponse) {
      return null;
    }

    const knownTx = this.txReceiptCache.get(txResponse.hash);
    if (knownTx !== undefined) {
      return knownTx;
    }

    // NOTE: The .wait method implements a lot of useful features like retries and exponential backoff.
    // So we prioritize it if available.
    if (typeof txResponse.wait === "function") {
      const maybeTxReceipt = (await txResponse.wait()) as
        | TransactionReceipt
        | null
        | undefined;
      if (maybeTxReceipt) {
        this.txReceiptCache.set(txResponse.hash, maybeTxReceipt);
        return maybeTxReceipt;
      }
    }

    // NOTE: ethers does not use strict mode so we widen the type here
    // This seems to be more reliable than txResponse.wait()
    const maybeTxReceipt = (await this.provider.waitForTransaction(
      txResponse.hash,
      1,
    )) as TransactionReceipt | null | undefined;
    if (maybeTxReceipt) {
      this.txReceiptCache.set(txResponse.hash, maybeTxReceipt);
      return maybeTxReceipt;
    }

    return null;
  }

  public async getTxReceiptOrThrow(
    txResponse: TransactionResponse,
  ): Promise<TransactionReceipt> {
    const txReceipt = await this.getTxReceipt(txResponse);
    if (txReceipt === null) {
      throw new Error(`Transaction not found: ${txResponse.hash}`);
    }
    return txReceipt;
  }

  public async getGasBalance(walletAddress: string): Promise<Decimal> {
    try {
      const balanceInWei = await this.provider.getBalance(walletAddress);
      return new Decimal(ethersUtils.formatUnits(balanceInWei));
    } catch {
      return new Decimal(0);
    }
  }

  public async getTokenBalance(
    contractAddress: string,
    walletAddress: string,
  ): Promise<Decimal | null> {
    const erc20Contract = ERC20__factory.connect(
      contractAddress,
      this.provider,
    );
    try {
      const balance = await erc20Contract.balanceOf(walletAddress);
      return new Decimal(balance.toString());
    } catch {
      return null;
    }
  }

  public async approveTokenAmount({
    atomicAmount,
    mintAddress,
    spenderAddress,
    wallet,
  }: ApproveTokenAmountParams): Promise<
    readonly ethers.providers.TransactionResponse[]
  > {
    const { signer } = wallet;
    if (!signer) {
      throw new Error("No EVM signer");
    }

    await wallet.switchNetwork(this.chainConfig.chainId);

    const allowance = await getAllowanceEth(
      spenderAddress,
      mintAddress,
      signer,
    );

    let approvalResponses: readonly ethers.providers.TransactionResponse[] = [];
    if (allowance.lt(atomicAmount)) {
      if (!allowance.isZero()) {
        // Reset to 0 to avoid a race condition allowing Wormhole to steal funds
        // See https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        // Note this is required by some ERC20 implementations such as USDT
        // See line 205 here: https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code
        const resetApprovalResponse = await this.approveErc20Token({
          atomicAmount: "0",
          mintAddress,
          signer,
          spenderAddress,
        });
        approvalResponses = resetApprovalResponse
          ? [...approvalResponses, resetApprovalResponse]
          : approvalResponses;
      }
      const approvalResponse = await this.approveErc20Token({
        atomicAmount,
        mintAddress,
        signer,
        spenderAddress,
      });
      approvalResponses = approvalResponse
        ? [...approvalResponses, approvalResponse]
        : approvalResponses;

      // Wait for approvalResponse to be mined, otherwise the transfer might fail ("transfer amount exceeds allowance")
      if (approvalResponse) {
        await this.getTxReceiptOrThrow(approvalResponse);
      }
    }

    return approvalResponses;
  }

  /**
   * Adapted from https://github.com/certusone/wormhole/blob/07446e2e23e51d98822182a77ad802b5d10f120a/sdk/js/src/token_bridge/transfer.ts#L42-L62
   */
  public async transferToken({
    atomicAmount,
    interactionId,
    targetAddress,
    targetChainId,
    mintAddress,
    wallet,
  }: TransferTokenParams): Promise<ethers.providers.TransactionResponse | null> {
    const { signer } = wallet;
    if (!signer) {
      throw new Error("No EVM signer");
    }
    const fee = 0; // for now, this won't do anything, we may add later
    const bridge = Bridge__factory.connect(
      this.chainConfig.wormhole.portal,
      signer,
    );
    const populatedTx = await bridge.populateTransaction.transferTokens(
      mintAddress,
      atomicAmount,
      targetChainId,
      targetAddress,
      fee,
      createNonce(),
    );
    const txRequest = appendHexDataToEvmTx(interactionId, populatedTx);
    return signer.sendTransaction(txRequest);
  }

  public async initiateWormholeTransfer({
    atomicAmount,
    interactionId,
    targetAddress,
    targetChainId,
    tokenProjectId,
    wallet,
    wrappedTokenInfo,
  }: InitiateWormholeTransferParams<EvmWalletAdapter>): Promise<{
    readonly approvalResponses: readonly ethers.providers.TransactionResponse[];
    readonly transferResponse: ethers.providers.TransactionResponse;
  }> {
    const mintAddress =
      wrappedTokenInfo?.wrappedAddress ??
      getTokenDetails(this.chainConfig, tokenProjectId).address;

    await wallet.switchNetwork(this.chainConfig.chainId);

    const approvalResponses = await this.approveTokenAmount({
      atomicAmount,
      mintAddress,
      spenderAddress: this.chainConfig.wormhole.portal,
      wallet,
    });

    const transferResponse = await this.transferToken({
      interactionId,
      mintAddress,
      atomicAmount,
      targetChainId,
      targetAddress,
      wallet,
    });

    if (transferResponse === null) {
      throw new Error(
        `Transaction not found (lock/burn from ${this.chainConfig.name})`,
      );
    }

    return {
      approvalResponses,
      transferResponse,
    };
  }

  /**
   * Adapted from https://github.com/certusone/wormhole/blob/2998031b164051a466bb98c71d89301ed482b4c5/sdk/js/src/token_bridge/redeem.ts#L24-L33
   */
  public async completeWormholeTransfer({
    interactionId,
    vaa,
    wallet,
  }: CompleteWormholeTransferParams<EvmWalletAdapter>): Promise<ethers.providers.TransactionResponse | null> {
    const { signer } = wallet;
    if (!signer) {
      throw new Error("No EVM signer");
    }
    const bridge = Bridge__factory.connect(
      this.chainConfig.wormhole.portal,
      signer,
    );
    const populatedTx = await bridge.populateTransaction.completeTransfer(vaa);
    const txRequest = appendHexDataToEvmTx(interactionId, populatedTx);
    return signer.sendTransaction(txRequest);
  }

  private async approveErc20Token({
    atomicAmount,
    signer,
    spenderAddress,
    mintAddress,
  }: ApproveErc20TokenParams): Promise<ethers.providers.TransactionResponse | null> {
    const token = ERC20__factory.connect(mintAddress, signer);
    return token.approve(spenderAddress, atomicAmount);
  }
}
