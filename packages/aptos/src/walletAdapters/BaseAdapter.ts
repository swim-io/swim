import type { Types } from "aptos";
import EventEmitter from "eventemitter3";

import type { AptosProtocol } from "../protocol";
import { APTOS_PROTOCOL } from "../protocol";

export interface AccountKeys {
  readonly publicKey: string;
  readonly address: string;
}

export interface WalletAdapterProps {
  readonly serviceName: string;
  readonly connected: boolean;
  readonly protocol: AptosProtocol;
  readonly address: string | null;
  readonly publicAccount: AccountKeys | null;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly signAndSubmitTransaction: (
    transaction: Types.TransactionPayload,
    options?: Partial<Types.SubmitTransactionRequest>,
  ) => Promise<Types.Transaction["hash"]>;
  readonly signTransaction: (
    transaction: Types.TransactionPayload,
    options?: Partial<Types.SubmitTransactionRequest>,
  ) => Promise<Uint8Array>;
  readonly network: () => Promise<string>;
}

export type WalletAdapter = WalletAdapterProps & EventEmitter;

export abstract class BaseWalletAdapter
  extends EventEmitter
  implements WalletAdapter
{
  public serviceName: string;
  public protocol: AptosProtocol;

  public constructor(serviceName: string) {
    super();
    this.serviceName = serviceName;
    this.protocol = APTOS_PROTOCOL;
  }

  public get connected(): boolean {
    return !!this.publicAccount?.publicKey;
  }

  public get address(): string | null {
    return this.publicAccount?.address || null;
  }

  public abstract get publicAccount(): AccountKeys | null;
  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: Partial<Types.SubmitTransactionRequest>,
  ): Promise<Types.Transaction["hash"]>;

  public abstract signTransaction(
    transaction: Types.TransactionPayload,
  ): Promise<Uint8Array>;

  public abstract network(): Promise<string>;
}
