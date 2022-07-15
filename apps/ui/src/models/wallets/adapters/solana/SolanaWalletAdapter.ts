import * as Sentry from "@sentry/react";
import type { SeverityLevel } from "@sentry/types";
import type { Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { SolanaProtocol } from "@swim-io/plugin-ecosystem-solana";
import { SOLANA_PROTOCOL } from "@swim-io/plugin-ecosystem-solana";
import EventEmitter from "eventemitter3";

import { SolanaWalletError, captureException } from "../../../../errors";

// TODO: Migrate to @solana/wallet-adapter.
export interface SolanaWalletAdapter extends EventEmitter {
  readonly publicKey: PublicKey | null;
  readonly address: string | null;
  readonly connected: boolean;
  readonly signTransaction: (transaction: Transaction) => Promise<Transaction>;
  readonly signAllTransactions: (
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ) => Promise<Transaction[]>;
  readonly connect: (args?: any) => Promise<unknown>;
  readonly disconnect: () => Promise<void>;
  readonly protocol: SolanaProtocol;
}

export class SolanaWeb3WalletAdapter
  extends EventEmitter
  implements SolanaWalletAdapter
{
  serviceName: string;
  serviceUrl: string;
  publicKey: PublicKey | null;
  readonly protocol: SolanaProtocol;

  protected getService: () => any;
  protected connecting: boolean;

  constructor(serviceName: string, serviceUrl: string, getService: () => any) {
    super();
    this.serviceName = serviceName;
    this.serviceUrl = serviceUrl;
    this.getService = getService;
    this.publicKey = null;
    this.connecting = false;
    this.protocol = SOLANA_PROTOCOL;

    this.on("connect", this.onPublicKeySet);
  }

  public get address(): string | null {
    return this.publicKey?.toBase58() || null;
  }

  public get connected(): boolean {
    return !!this.address;
  }

  protected get service(): any {
    return this.getService();
  }

  private get sentryContextKey(): string {
    return "Solana Wallet";
  }

  public async signAllTransactions(
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ): Promise<Transaction[]> {
    if (!this.service) {
      throw new Error("No wallet service connected");
    }

    try {
      return this.service.signAllTransactions(transactions);
    } catch (error) {
      throw new SolanaWalletError("", error);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.service) {
      throw new Error("No wallet service connected");
    }

    try {
      return this.service.signTransaction(transaction);
    } catch (error) {
      throw new SolanaWalletError("", error);
    }
  }

  async connect(args?: any): Promise<void> {
    if (this.connecting) {
      return;
    }

    if (!this.service) {
      this.emit(
        "error",
        `${this.serviceName} Error`,
        `Please install ${this.serviceName}:\n${this.serviceUrl}. If you have multiple wallet extensions, they may interfere with each other.`,
      );
      return;
    }

    this.connecting = true;
    try {
      await this.connectService(args);
    } catch (error) {
      this.publicKey = null;
      this.emit(
        "error",
        "Connection error",
        `Connection to ${this.serviceName} failed.`,
      );

      captureException(error);

      this.connecting = false;
    }
  }

  async connectService(args?: any): Promise<void> {
    const publicKey = await this.service.getAccount();
    this.publicKey = new PublicKey(publicKey);
    this.emit("connect", this.publicKey);

    this.connecting = false;
  }

  async disconnect(): Promise<void> {
    if (this.publicKey) {
      this.publicKey = null;
      Sentry.configureScope((scope) => scope.setUser(null));
      Sentry.setContext(this.sentryContextKey, {});
      const level: SeverityLevel = "info";
      Sentry.addBreadcrumb({
        category: "wallet",
        message: `Disconnected from ${this.sentryContextKey}`,
        level,
      });

      this.emit("disconnect");
    }
  }

  onPublicKeySet(): void {
    if (this.publicKey === null) {
      return;
    }

    // Identify users by their Solana wallet address
    Sentry.setUser({ id: this.publicKey.toBase58() });
    Sentry.setContext(this.sentryContextKey, {
      walletName: this.serviceName,
      address: this.publicKey.toBase58(),
    });
    const level: SeverityLevel = "info";
    Sentry.addBreadcrumb({
      category: "wallet",
      message: `Connected to ${
        this.sentryContextKey
      } ${this.publicKey.toBase58()}`,
      level,
    });
  }
}
