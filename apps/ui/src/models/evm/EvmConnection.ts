import { ERC20__factory } from "@swim-io/evm-contracts";
import { isNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import { ethers } from "ethers";

import type { LocalProvider } from "./LocalProvider";
import type { MoralisProvider } from "./MoralisProvider";
import type { PolkadotProvider } from "./PolkadotProvider";

type EtherscanProvider = ethers.providers.EtherscanProvider;
type TransactionReceipt = ethers.providers.TransactionReceipt;
type TransactionResponse = ethers.providers.TransactionResponse;

export type Provider =
  | MoralisProvider
  | EtherscanProvider
  | LocalProvider
  | PolkadotProvider;

export class EvmConnection {
  public provider: Provider;
  // eslint-disable-next-line functional/prefer-readonly-type
  private readonly txReceiptCache: Map<string, TransactionReceipt>;

  constructor(provider: Provider) {
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
        | ethers.providers.TransactionReceipt
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
    )) as ethers.providers.TransactionReceipt | null | undefined;
    if (maybeTxReceipt) {
      this.txReceiptCache.set(txResponse.hash, maybeTxReceipt);
      return maybeTxReceipt;
    }

    return null;
  }

  public async getTxReceiptOrThrow(
    txResponse: TransactionResponse,
  ): Promise<ethers.providers.TransactionReceipt> {
    const txReceipt = await this.getTxReceipt(txResponse);
    if (txReceipt === null) {
      throw new Error(`Transaction not found: ${txResponse.hash}`);
    }
    return txReceipt;
  }

  public async getEthBalance(walletAddress: string): Promise<Decimal> {
    try {
      const balanceInWei = await this.provider.getBalance(walletAddress);
      return new Decimal(ethers.utils.formatUnits(balanceInWei));
    } catch {
      return new Decimal(0);
    }
  }

  public async getErc20Balance(
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
}
