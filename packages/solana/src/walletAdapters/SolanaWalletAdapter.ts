import type { PublicKeyInitData, Transaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import type { SolanaProtocol } from "../protocol";
import { SOLANA_PROTOCOL } from "../protocol";

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
  // for logging
  readonly serviceName: string;
}

export interface SolanaWeb3WalletService {
  readonly signAllTransactions: (
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ) => Promise<Transaction[]>;
  readonly signTransaction: (transaction: Transaction) => Promise<Transaction>;
  readonly getAccount: () => Promise<PublicKeyInitData>;
}

export class SolanaWeb3WalletAdapter<
    S extends SolanaWeb3WalletService = SolanaWeb3WalletService,
  >
  extends EventEmitter
  implements SolanaWalletAdapter
{
  public publicKey: PublicKey | null;
  public readonly protocol: SolanaProtocol;
  public readonly serviceName: string;
  protected connecting: boolean;
  private readonly getService: () => S | null;
  private readonly serviceUrl: string;

  constructor(
    serviceName: string,
    serviceUrl: string,
    getService: () => S | null,
  ) {
    super();
    this.serviceName = serviceName;
    this.serviceUrl = serviceUrl;
    this.getService = getService;
    this.publicKey = null;
    this.connecting = false;
    this.protocol = SOLANA_PROTOCOL;
  }

  public get address(): string | null {
    return this.publicKey?.toBase58() || null;
  }

  public get connected(): boolean {
    return !!this.address;
  }

  protected get service(): S | null | undefined {
    return this.getService();
  }

  public async signAllTransactions(
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ): Promise<Transaction[]> {
    if (!this.service) {
      throw new Error("No wallet service connected");
    }

    return await this.service.signAllTransactions(transactions);
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.service) {
      throw new Error("No wallet service connected");
    }

    return await this.service.signTransaction(transaction);
  }

  public async connect(args?: any): Promise<void> {
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

      throw error;
    } finally {
      this.connecting = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async connectService(args?: any): Promise<void> {
    if (!this.service) {
      throw new Error("No wallet service available");
    }

    const publicKey = await this.service.getAccount();
    this.publicKey = new PublicKey(publicKey);
    this.emit("connect", this.publicKey);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async disconnect(): Promise<void> {
    if (this.publicKey) {
      this.publicKey = null;
      this.emit("disconnect");
    }
  }
}
