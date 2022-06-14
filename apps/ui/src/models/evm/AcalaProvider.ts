import { Provider } from "@acala-network/bodhi";
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
import type { ethers } from "ethers";

type EthersTransactionReceipt = ethers.providers.TransactionReceipt;

interface TransactionReceipt {
  readonly blockHash: string;
  readonly blockNumber: number;
  readonly from: string;
  readonly gasUsed: number;
  readonly transactionHash: string;
  readonly to: string;
  readonly type: number;
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
        blockNumber
      }
    }
  }
`;

// This also supports Karura.
export class AcalaProvider extends Provider {
  private readonly client: ApolloClient<NormalizedCacheObject>;

  constructor(providerUrl: string) {
    super(
      createApiOptions({
        provider: new WsProvider(providerUrl),
      }),
    );

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      link: createHttpLink({
        uri: "https://tc7-graphql.aca-dev.network",
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
    const receipt = await this.getTransactionReceipt(transactionHash);

    // TODO: getTransactionReceipt() return type implies it can't be null,
    // but that isn't true.
    if ((receipt ? receipt.confirmations : 0) >= confirmations) {
      return receipt;
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

  // TODO: This will use a graphql client to execute a query.
  async getHistory(
    addressOrName: string,
    startBlock?: number | void,
    endBlock?: number | void,
  ): Promise<EthersTransactionReceipt> {
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
    return response.map((moralisTx) => {
      return this.toTxResponse(moralisTx);
    });
  }

  private toTxResponse(
    moralisTx: TransactionReceipt,
  ): TransactionResponse {
    const waitFn = async (confirmations = 1): Promise<EthersTransactionReceipt> => {
      return super.waitForTransaction(
        txResponse.hash,
        confirmations,
        this.txTimeoutMs,
      );
    };

    const txResponse: TransactionResponse = {
      blockHash: moralisTx.block_hash,
      blockNumber: Number(moralisTx.block_number),
      chainId: DISABLE_CHAIN_ID,
      // Note, confirmations is set to 0 since MoralisTransaction does not
      // export that data.
      confirmations: 0,
      data: moralisTx.input,
      from: moralisTx.from_address,
      gasLimit: BigNumber.from(moralisTx.gas),
      gasPrice: BigNumber.from(moralisTx.gas_price),
      hash: moralisTx.hash,
      nonce: Number(moralisTx.nonce),
      value: BigNumber.from(moralisTx.value),
      to: moralisTx.to_address,
      type: LEGACY_TX_TYPE,
      timestamp: Math.floor(
        new Date(moralisTx.block_timestamp).getTime() * MILLI_TO_MICRO,
      ),
      wait: waitFn,
    };
    return txResponse;
  }
}
function orderBy<T, U>(arg0: { query: import("@apollo/client").DocumentNode; variables: {}; }, arg1: { blockNumber: { greaterThan: number; lessThan: number; }; to: { equalTo: string; }; }, orderBy: any, arg3: string) {
  throw new Error("Function not implemented.");
}

