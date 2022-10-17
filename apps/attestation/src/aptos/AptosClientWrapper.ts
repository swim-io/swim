import type { AptosAccount, Types } from "aptos";
import { AptosClient } from "aptos";

export class AptosClientWrapper {
  private readonly client: AptosClient;

  public constructor(nodeUrl: string) {
    this.client = new AptosClient(nodeUrl);
  }

  public executeEntryFunction = async (
    sender: AptosAccount,
    payload: Types.EntryFunctionPayload,
    opts?: Partial<Types.SubmitTransactionRequest>,
  ): Promise<string> =>
    this.client
      .generateTransaction(sender.address(), payload, { ...opts })
      // simulate transaction
      .then((rawTx) =>
        this.client
          .simulateTransaction(sender, rawTx)
          .then((sims) =>
            sims.forEach((tx) => {
              if (!tx.success) {
                console.error(JSON.stringify(tx, null, 2));
                throw new Error(
                  `Transaction simulation failed: ${tx.vm_status}`,
                );
              }
            }),
          )
          .then(() => rawTx),
      )
      // sign & submit transaction if simulation is successful
      .then((rawTx) => this.client.signTransaction(sender, rawTx))
      .then((signedTx) => this.client.submitTransaction(signedTx))
      .then(async (pendingTx) => {
        await this.client.waitForTransaction(pendingTx.hash);
        return pendingTx.hash;
      });
}
