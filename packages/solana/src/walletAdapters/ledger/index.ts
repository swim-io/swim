import type Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import type { PublicKey, Transaction } from "@solana/web3.js";
import { assertIsError } from "@swim-io/utils";
import EventEmitter from "eventemitter3";

import type { SolanaProtocol } from "../../protocol";
import { SOLANA_PROTOCOL } from "../../protocol";
import type { SolanaWalletAdapter } from "../SolanaWalletAdapter";

import { getPublicKey, signTransaction } from "./core";

export class LedgerWalletAdapter
  extends EventEmitter
  implements SolanaWalletAdapter
{
  public readonly protocol: SolanaProtocol;
  public readonly serviceName = "Ledger";
  private _connecting: boolean;
  private _publicKey: PublicKey | null;
  private _transport: Transport | null;

  public constructor() {
    super();
    this._connecting = false;
    this._publicKey = null;
    this._transport = null;
    this.protocol = SOLANA_PROTOCOL;
  }

  public get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  public get address(): string | null {
    return this._publicKey?.toBase58() || null;
  }

  public get connected(): boolean {
    return !!this.address;
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._transport || !this._publicKey) {
      throw new Error("Not connected to Ledger");
    }

    // @TODO: account selection (derivation path changes with account)
    const signature = await signTransaction(this._transport, transaction);

    transaction.addSignature(this._publicKey, signature);

    return transaction;
  }

  public async signAllTransactions(
    // eslint-disable-next-line functional/prefer-readonly-type
    transactions: Transaction[],
    // eslint-disable-next-line functional/prefer-readonly-type
  ): Promise<Transaction[]> {
    return Promise.all(
      transactions.map((tx: Transaction) => this.signTransaction(tx)),
    );
  }

  public async connect(): Promise<void> {
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
    } catch (error) {
      assertIsError(error);
      this.emit("error", "Ledger error", error.message);
      await this.disconnect();
    } finally {
      this._connecting = false;
    }
  }

  public async disconnect(): Promise<void> {
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
