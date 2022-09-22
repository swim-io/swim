import type {
  SubmitTransactionRequest,
  Transaction,
  TransactionPayload,
} from "aptos/src/generated";

import { BaseWalletAdapter } from "./BaseAdapter";
import type { AccountKeys } from "./BaseAdapter";

interface ConnectMartianResponse {
  readonly address: string;
  readonly method: string;
  readonly publicKey: string;
  readonly status: number;
}

export interface IMartianWallet {
  readonly connect: () => Promise<ConnectMartianResponse>;
  readonly account: () => Promise<AccountKeys>;
  readonly isConnected: () => Promise<boolean>;
  readonly generateTransaction: (
    sender: string,
    payload: TransactionPayload,
    options?: Partial<SubmitTransactionRequest>,
  ) => Promise<string>;
  readonly signAndSubmitTransaction: (
    transaction: string,
  ) => Promise<Transaction["hash"]>;
  readonly signTransaction: (transaction: string) => Promise<string>;
  readonly disconnect: () => Promise<void>;
  readonly network: () => Promise<string>;
}

interface MartianWindow extends Window {
  readonly martian?: IMartianWallet;
}

declare const window: MartianWindow;

export const MartianWalletName = "Martian";

export class MartianWalletAdapter extends BaseWalletAdapter {
  protected provider: IMartianWallet | undefined;

  protected wallet: AccountKeys | null = null;

  private connecting = false;

  public constructor() {
    super(MartianWalletName);
  }

  public get publicAccount() {
    return this.wallet;
  }

  public async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;

      this.connecting = true;

      const provider = this.getProviderOrError();
      const isConnected = await provider.isConnected();

      if (isConnected) {
        await provider.disconnect();
      }

      const response = await provider.connect();

      if (response.status !== 200) {
        throw new Error(
          `Failed to connect to martian wallet. Status was ${response.status}`,
        );
      }

      this.wallet = await provider.account();
      this.emit("connect", this.wallet.address);
    } catch (error) {
      this.wallet = null;
      this.emit(
        "error",
        "Connection error",
        `Connection to ${this.serviceName} failed.`,
      );
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    this.wallet = null;

    try {
      const provider = this.getProviderOrError();
      await provider.disconnect();
    } catch (error) {
      this.emit(
        "error",
        "Disconnection error",
        `Disconnection from ${this.serviceName} failed.`,
      );
      throw error;
    }

    this.emit("disconnect");
  }

  public async signTransaction(
    transactionPayload: TransactionPayload,
    options?: Partial<SubmitTransactionRequest>,
  ): Promise<Uint8Array> {
    try {
      const { provider, wallet } = this.getConnectedProviderOrError();
      const tx = await provider.generateTransaction(
        wallet.address,
        transactionPayload,
        options,
      );

      const response = await provider.signTransaction(tx);
      return new Uint8Array(response.split(",").map(Number));
    } catch (error) {
      this.emit(
        "error",
        "Sign transaction error",
        `Signing a transaction with ${this.serviceName} wallet failed.`,
      );
      throw error;
    }
  }

  public async signAndSubmitTransaction(
    transactionPayload: TransactionPayload,
    options?: Partial<SubmitTransactionRequest>,
  ): Promise<Transaction["hash"]> {
    try {
      const { provider, wallet } = this.getConnectedProviderOrError();
      const tx = await provider.generateTransaction(
        wallet.address,
        transactionPayload,
        options,
      );
      const hash = await provider.signAndSubmitTransaction(tx);
      return hash;
    } catch (error) {
      this.emit(
        "error",
        "Submit transaction error",
        `Submitting a transaction with ${this.serviceName} wallet failed.`,
      );
      throw error;
    }
  }

  public async network(): Promise<string> {
    return this.getProviderOrError().network();
  }

  public getProvider: () => IMartianWallet | null = () =>
    window.martian || null;

  private getConnectedProviderOrError(): {
    readonly provider: IMartianWallet;
    readonly wallet: AccountKeys;
  } {
    if (!this.wallet) throw new Error("No connected martian wallet was found");
    return {
      wallet: this.wallet,
      provider: this.getProviderOrError(),
    };
  }

  private getProviderOrError(): IMartianWallet {
    const provider = this.getProvider();
    if (!provider) throw new Error("No martian wallet was found");
    return provider;
  }
}
