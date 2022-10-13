import type { ChainId } from "@certusone/wormhole-sdk";
import {
  Bridge__factory,
  createNonce,
  getAllowanceEth,
} from "@certusone/wormhole-sdk";
import { Client, getTokenDetails } from "@swim-io/core";
import type {
  CompleteWormholeTransferParams,
  InitiateWormholeTransferParams,
  TokenDetails,
} from "@swim-io/core";
import { ERC20__factory } from "@swim-io/evm-contracts";
import { isNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { ethers, providers } from "ethers";
import { utils as ethersUtils } from "ethers";

import type { EvmChainConfig, EvmEcosystemId, EvmTx } from "./protocol";
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

export interface EvmClientOptions {
  readonly provider: GetHistoryProvider;
}

export class EvmClient extends Client<
  EvmEcosystemId,
  EvmChainConfig,
  EvmTx,
  EvmWalletAdapter
> {
  public readonly provider: GetHistoryProvider;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txReceiptCache: Map<string, TransactionReceipt>;

  public constructor(
    ecosystemId: EvmEcosystemId,
    chainConfig: EvmChainConfig,
    { provider }: EvmClientOptions,
  ) {
    super(ecosystemId, chainConfig);
    this.provider = provider;
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

  public async getTx(
    txIdOrResponse: TransactionResponse | string,
  ): Promise<EvmTx> {
    const response = typeof txIdOrResponse === "string" ? null : txIdOrResponse;
    const id =
      typeof txIdOrResponse === "string" ? txIdOrResponse : txIdOrResponse.hash;
    const receipt = await this.getTxReceipt(txIdOrResponse);

    if (receipt === null) {
      throw new Error(`Transaction not found: ${id}`);
    }

    return {
      id: receipt.transactionHash,
      ecosystemId: this.ecosystemId,
      receipt,
      timestamp: response?.timestamp ?? null,
      interactionId: null,
    };
  }

  public async getTxs(
    txIdsOrResponses: readonly (TransactionResponse | string)[],
  ): Promise<readonly EvmTx[]> {
    return Promise.all(
      txIdsOrResponses.map((txIdOrResponse) => this.getTx(txIdOrResponse)),
    );
  }

  public async getGasBalance(walletAddress: string): Promise<Decimal> {
    try {
      const balanceInWei = await this.provider.getBalance(walletAddress);
      return new Decimal(ethersUtils.formatEther(balanceInWei));
    } catch {
      return new Decimal(0);
    }
  }

  public async getTokenBalance(
    owner: string,
    tokenDetails: TokenDetails,
  ): Promise<Decimal> {
    const erc20Contract = ERC20__factory.connect(
      tokenDetails.address,
      this.provider,
    );
    try {
      const balance = await erc20Contract.balanceOf(owner);
      return new Decimal(
        ethersUtils.formatUnits(balance, tokenDetails.decimals),
      );
    } catch {
      return new Decimal(0);
    }
  }

  public async getTokenBalances(
    owner: string,
    tokenDetails: readonly TokenDetails[],
  ): Promise<readonly Decimal[]> {
    return Promise.all(
      tokenDetails.map(this.getTokenBalance.bind(this, owner)),
    );
  }

  public async initiateWormholeTransfer({
    atomicAmount,
    interactionId,
    sourceAddress,
    targetAddress,
    targetChainId,
    wallet,
  }: InitiateWormholeTransferParams<EvmWalletAdapter>): Promise<{
    readonly approvalResponses: readonly ethers.providers.TransactionResponse[];
    readonly transferResponse: ethers.providers.TransactionResponse;
  }> {
    await wallet.switchNetwork(this.chainConfig.chainId);

    const approvalResponses = await this.approveTokenAmount({
      atomicAmount,
      mintAddress: sourceAddress,
      spenderAddress: this.chainConfig.wormhole.portal,
      wallet,
    });

    const transferResponse = await this.transferToken({
      interactionId,
      mintAddress: sourceAddress,
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

  private async getTxReceipt(
    txIdOrResponse: string | TransactionResponse,
  ): Promise<TransactionReceipt | null> {
    const txId =
      typeof txIdOrResponse === "string" ? txIdOrResponse : txIdOrResponse.hash;
    const txResponse =
      typeof txIdOrResponse === "string" ? null : txIdOrResponse;

    const knownTx = this.txReceiptCache.get(txId);
    if (knownTx !== undefined) {
      return knownTx;
    }

    // NOTE: The .wait method implements a lot of useful features like retries and exponential backoff.
    // So we prioritize it if available.
    if (typeof txResponse?.wait === "function") {
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
    const maybeTxReceipt = (await this.provider.waitForTransaction(txId, 1)) as
      | TransactionReceipt
      | null
      | undefined;
    if (maybeTxReceipt) {
      this.txReceiptCache.set(txId, maybeTxReceipt);
      return maybeTxReceipt;
    }

    return null;
  }

  private async getTxReceiptOrThrow(
    txResponse: TransactionResponse,
  ): Promise<TransactionReceipt> {
    const txReceipt = await this.getTxReceipt(txResponse);
    if (txReceipt === null) {
      throw new Error(`Transaction not found: ${txResponse.hash}`);
    }
    return txReceipt;
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

  /**
   * Adapted from https://github.com/certusone/wormhole/blob/07446e2e23e51d98822182a77ad802b5d10f120a/sdk/js/src/token_bridge/transfer.ts#L42-L62
   */
  private async transferToken({
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
}
