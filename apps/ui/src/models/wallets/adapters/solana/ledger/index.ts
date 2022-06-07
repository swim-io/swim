import type Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import type { PublicKey, Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";

import { Protocol } from "../../../../../config";
import type { SolanaWalletAdapter } from "../SolanaWalletAdapter";

import { getPublicKey, signTransaction } from "./core";

export class LedgerWalletAdapter
  extends EventEmitter
  implements SolanaWalletAdapter
{
  _connecting: boolean;
  _publicKey: PublicKey | null;
  _transport: Transport | null;
  readonly protocol: Protocol.Solana;

  constructor() {
    super();
    this._connecting = false;
    this._publicKey = null;
    this._transport = null;
    this.protocol = Protocol.Solana;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  public get address(): string | null {
    return this._publicKey?.toBase58() || null;
  }

  public get connected(): boolean {
    return !!this.address;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._transport || !this._publicKey) {
      throw new Error("Not connected to Ledger");
    }

    // @TODO: account selection (derivation path changes with account)
    const signature = await signTransaction(this._transport, transaction);

    transaction.addSignature(this._publicKey, signature);

    return transaction;
  }

  async signAllTransactions(
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ): Promise<Transaction[]> {
    return Promise.all(
      transactions.map((tx: Transaction) => this.signTransaction(tx)),
    );
  }

  async connect(): Promise<void> {
    if (this._connecting) {
      return;
    }

    this._connecting = true;

    try {
      // @TODO: transport selection (WebUSB, WebHID, bluetooth, ...)
      this._transport = await TransportWebUSB.create();
      // @TODO: account selection
      this._publicKey = await getPublicKey(this._transport);
      this.emit("connect", this._publicKey);
    } catch (error: any) {
      this.emit("error", "Ledger error", error?.message);
      await this.disconnect();
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    let emit = false;
    if (this._transport) {
      await this._transport.close();
      this._transport = null;
      emit = true;
    }

    this._connecting = false;
    this._publicKey = null;

    if (emit) {
      this.emit("disconnect");
    }
  }
}
