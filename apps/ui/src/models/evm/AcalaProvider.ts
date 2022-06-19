import type { TX, TXReceipt } from "@acala-network/eth-providers";
import { EvmRpcProvider } from "@acala-network/eth-providers";
import { SubqlProvider } from "@acala-network/eth-providers/lib/utils/subqlProvider";
import type { ethers } from "ethers";
import { BigNumber } from "ethers";

type TransactionReceipt = ethers.providers.TransactionReceipt;
type TransactionResponse = ethers.providers.TransactionResponse;

const DEFAULT_TIMEOUT_MS = 60 * 1000;
const DISABLE_CHAIN_ID = 0;

const createQuery = (
  numTxs: number,
  start: number,
  end: number,
  fromAddress: string,
): string => {
  return `
  query {
    transactionReceipts(
      first: ${numTxs},
      filter: {
        from: {
          equalTo: "${fromAddress}"
        },
        blockNumber: {
          greaterThan: "${start}"
          lessThan: "${end}"
        }
      }
    ) {
      nodes {
        transactionHash
      }
    }
  }
  `;
};

export class AcalaProvider extends EvmRpcProvider {
  private readonly subqlProvider: SubqlProvider;
  constructor(providerUrl: string, subqlUrl: string) {
    super(providerUrl, {
      subqlUrl: subqlUrl,
    });
    this.subqlProvider = new SubqlProvider(subqlUrl);
  }

  // TODO: Replace with this.EvmRpcProvider.waitForTransaction() when they
  // implement it.
  // Code is copied from ethers impl:
  // https://github.com/ethers-io/ethers.js/blob/master/packages/providers/src.ts/base-provider.ts#L1278
  waitForTransaction = async (
    transactionHash: string,
    confirmations?: number | undefined,
    timeout?: number | undefined,
  ): Promise<TransactionReceipt> => {
    return this._waitForTransaction(
      transactionHash,
      confirmations == null ? 1 : confirmations,
      timeout || 0,
    );
  };

  async _waitForTransaction(
    transactionHash: string,
    confirmations: number,
    timeout: number,
  ): Promise<TransactionReceipt> {
    const receipt = await this.getTXReceiptByHash(transactionHash);

    if (receipt && receipt.confirmations >= confirmations) {
      return this.toTxReceipt(receipt);
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line functional/prefer-readonly-type
      const cancelFuncs: Array<() => void> = [];

      let done = false;
      const alreadyDone = function () {
        if (done) {
          return true;
        }
        done = true;
        cancelFuncs.forEach((func) => {
          func();
        });
        return false;
      };

      const minedHandler = (reciept: TransactionReceipt) => {
        if (reciept.confirmations < confirmations) {
          return;
        }
        if (alreadyDone()) {
          return;
        }
        resolve(reciept);
      };
      this.addEventListener(transactionHash, minedHandler);

      // eslint-disable-next-line functional/immutable-data
      cancelFuncs.push(() => {
        this.removeListener(transactionHash, minedHandler);
      });

      if (typeof timeout === "number" && timeout > 0) {
        const timer = setTimeout(() => {
          if (alreadyDone()) {
            return;
          }
          reject();
        }, timeout);
        timer.unref();
        // eslint-disable-next-line functional/immutable-data
        cancelFuncs.push(() => {
          clearTimeout(timer);
        });
      }
    });
  }

  async getHistory(
    addressOrName: string,
    startBlock?: number,
    endBlock?: number,
  ): Promise<readonly TransactionResponse[]> {
    const query = createQuery(
      100,
      startBlock ?? 0,
      endBlock ?? 99999999,
      addressOrName,
    );
    const queryRes = await this.subqlProvider.queryGraphql(query);
    if (!queryRes.transactionReceipts) {
      return [];
    }
    const txResponses = Promise.all(
      queryRes.transactionReceipts.nodes.map(async (node) => {
        if (!node) {
          throw new Error(`Malformed graphQl query: ${query}`);
        }
        return this.toTxResponse(
          await this.getTransactionByHash(node.transactionHash),
        );
      }),
    );
    return txResponses;
  }

  private toTxResponse(tx: TX | null): TransactionResponse {
    const waitFn = async (confirmations = 1): Promise<TransactionReceipt> => {
      return this.waitForTransaction(
        txResponse.hash,
        confirmations,
        DEFAULT_TIMEOUT_MS,
      );
    };
    const txResponse: TransactionResponse = {
      hash: tx?.hash ?? "",
      // Note, confirmations is set to 0 since MoralisTransaction does not
      // export that data.
      confirmations: 0,
      from: tx?.from ?? "",
      wait: waitFn,
      nonce: tx?.nonce ?? 0,
      gasLimit: BigNumber.from(tx?.gas ?? "0"),
      data: tx?.input ?? "",
      value: BigNumber.from(tx?.value ?? "0"),
      chainId: DISABLE_CHAIN_ID,
    };
    return txResponse;
  }

  private toTxReceipt(tx: TXReceipt): TransactionReceipt {
    const txReceipt: TransactionReceipt = {
      to: tx.to ?? "",
      from: tx.from,
      contractAddress: tx.contractAddress ?? "",
      transactionIndex: tx.transactionIndex ?? 0,
      gasUsed: tx.gasUsed,
      logsBloom: tx.logsBloom,
      blockHash: tx.blockHash ?? "",
      transactionHash: tx.transactionHash,
      logs: tx.logs,
      blockNumber: tx.blockNumber ?? 0,
      confirmations: tx.confirmations,
      cumulativeGasUsed: tx.cumulativeGasUsed,
      effectiveGasPrice: tx.effectiveGasPrice,
      byzantium: true,
      type: tx.type,
    };
    return txReceipt;
  }
}
