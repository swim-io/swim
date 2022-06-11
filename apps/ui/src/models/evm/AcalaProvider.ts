// TODO:
// * How to properly plug into EvmConnection (env stuff too)
// * Set up environment variable for connection
// * Stop pissing off EsLint

import { Provider } from "@acala-network/bodhi";
import { createApiOptions } from "@acala-network/eth-providers";
import { WsProvider } from "@polkadot/api";
import type { ethers } from "ethers";

type TransactionReceipt = ethers.providers.TransactionReceipt;

export class AcalaProvider extends Provider {
  constructor() {
    super(
      createApiOptions({
        provider: new WsProvider("ws://localhost:9944"),
      }),
    );
  }

  // TODO: This will use a graphql client to execute a query.
  async getHistory(
    addressOrName: string | Promise<string>,
    startBlock?: number | void,
    endBlock?: number | void,
  ): Promise<void> {
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

    // Receipt is already good
    if ((receipt ? receipt.confirmations : 0) >= confirmations) {
      return receipt;
    }

    // Poll until the receipt is good...
    return new Promise((resolve, reject) => {
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
      // what the fuck is this.on
      this.on(transactionHash, minedHandler);

      cancelFuncs.push(() => {
        this.removeListener(transactionHash, minedHandler);
      });

      if (typeof timeout === "number" && timeout > 0) {
        const timer = setTimeout(() => {
          if (alreadyDone()) {
            return;
          }
          reject(
            // Use normal logger?
            // logger.makeError("timeout exceeded", Logger.errors.TIMEOUT, {
            //   timeout: timeout,
            // }),
          );
        }, timeout);
        timer.unref();
        cancelFuncs.push(() => {
          clearTimeout(timer);
        });
      }
    });
  }
}
