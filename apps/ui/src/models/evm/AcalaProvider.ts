import { Provider } from "@acala-network/bodhi";
import type { TXReceipt } from "@acala-network/eth-providers";
import { createApiOptions } from "@acala-network/eth-providers";
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} from "@apollo/client";
import type { NormalizedCacheObject } from "@apollo/client/core";
import { WsProvider } from "@polkadot/api";
import { fetch } from "cross-fetch";
import { BigNumber } from "ethers";
import type { ethers } from "ethers";

const DISABLE_CHAIN_ID = 0;

type EthersTransactionReceipt = ethers.providers.TransactionReceipt;
type TransactionResponse = ethers.providers.TransactionResponse;

interface Log {
  readonly data: string;
}

interface LogConnection {
  // When are there ever multiple logs for a TxReceipt?
  readonly nodes: readonly Log[];
}

interface TransactionReceipt {
  readonly blockHash: string;
  readonly blockNumber: number;
  readonly from: string;
  readonly transactionHash: string;
  readonly to: string;
  readonly type: number;
  readonly logs: LogConnection;
}

interface TransactionReceiptsConnection {
  readonly nodes: readonly TransactionReceipt[];
}

interface TransactionReceiptsResponse {
  readonly transactionReceipts: TransactionReceiptsConnection;
}

interface BigFloatFilter {
  readonly lessThan: number;
  readonly greaterThan: number;
}

interface StringFilter {
  readonly equalTo: string;
}

interface TransactionReceiptFilter {
  readonly blockNumber: BigFloatFilter;
  readonly to: StringFilter;
}

interface TransactionReceiptsArguments {
  readonly filter: TransactionReceiptFilter;
  readonly orderBy: string;
}

const USER_TRANSACTION_RECEIPT_QUERY = gql`
  query ($filter: TransactionReceiptFilter) {
    transactionReceipts(filter: $filter) {
      nodes {
        blockHash
        blockNumber
        from
        transactionHash
        to
        type
        logs {
          nodes {
            data
          }
        }
      }
    }
  }
`;

// This also supports Karura.
export class AcalaProvider extends Provider {
  private readonly client: ApolloClient<NormalizedCacheObject>;

  constructor(providerUrl: string, subqlUrl: string) {
    super(
      createApiOptions({
        provider: new WsProvider(providerUrl),
      }),
    );

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      link: createHttpLink({
        uri: subqlUrl,
        fetch: fetch,
      }),
    });
  }

  waitForTransaction = async (
    transactionHash: string,
    confirmations?: number | undefined,
    timeout?: number | undefined,
  ): Promise<EthersTransactionReceipt> => {
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
  ): Promise<EthersTransactionReceipt> {
    const receipt = await this.getTXReceiptByHash(transactionHash);

    // TODO: getTransactionReceipt() return type implies it can't be null,
    // but that isn't true.
    if (receipt && receipt.confirmations >= confirmations) {
      return this.toTxReceipt(receipt);
    }

    // Poll until the receipt is good...
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

      const minedHandler = (reciept: EthersTransactionReceipt) => {
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
          // TODO: Replace with whatever logger we use.
          // logger.makeError("timeout exceeded", Logger.errors.TIMEOUT, {
          //   timeout: timeout,
          // }
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
    startBlock?: number | void,
    endBlock?: number | void,
  ): Promise<readonly TransactionResponse[]> {
    const response = await this.client.query<
      TransactionReceiptsResponse,
      TransactionReceiptsArguments
    >({
      query: USER_TRANSACTION_RECEIPT_QUERY,
      variables: {
        filter: {
          blockNumber: {
            greaterThan: startBlock ?? 0,
            lessThan: endBlock ?? 99999999,
          },
          to: {
            equalTo: addressOrName,
          },
        },
        // TODO: Move to const.
        orderBy: "BLOCK_NUMBER_ASC",
      },
    });

    return response.data.transactionReceipts.nodes.map((txReceipt) => {
      return this.toTxResponse(txReceipt);
    });
  }

  private toTxResponse(tx: TransactionReceipt): TransactionResponse {
    const waitFn = async (
      confirmations = 1,
    ): Promise<EthersTransactionReceipt> => {
      return this.waitForTransaction(txResponse.hash, confirmations);
    };

    const txResponse: TransactionResponse = {
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      chainId: DISABLE_CHAIN_ID,
      // Note, confirmations is set to 0 since MoralisTransaction does not
      // export that data.
      confirmations: 0,
      // Just retrieve first thing
      data: tx.logs.nodes.length > 0 ? tx.logs.nodes[0].data : "",
      from: tx.from,
      // not exported
      gasLimit: BigNumber.from(0),
      hash: tx.transactionHash,
      // not exported
      nonce: Number(0),
      // note exported
      value: BigNumber.from(0),
      to: tx.to,
      // not exported.
      wait: waitFn,
    };
    return txResponse;
  }

  private toTxReceipt(tx: TXReceipt): EthersTransactionReceipt {
    const txReceipt: EthersTransactionReceipt = {
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
