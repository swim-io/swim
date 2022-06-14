import { Provider } from "@acala-network/bodhi";
import { createApiOptions } from "@acala-network/eth-providers";
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import type { NormalizedCacheObject } from "@apollo/client/core";
import { WsProvider } from "@polkadot/api";
import { fetch } from "cross-fetch";
import type { ethers } from "ethers";

type TransactionReceipt = ethers.providers.TransactionReceipt;

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

  // TODO: This will use a graphql client to execute a query.
  async getHistory(
    addressOrName: string | Promise<string>,
    startBlock?: number | void,
    endBlock?: number | void,
  ): Promise<void> {
    console.log(this.client);
    // Promise<readonly TransactionResponse[]> {};
    return;
  }

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
}
