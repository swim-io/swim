/* eslint-disable import/unambiguous */

// Adapted from https://registry.npmjs.org/@project-serum/sol-wallet-adapter/-/sol-wallet-adapter-0.2.6.tgz
declare module "@project-serum/sol-wallet-adapter" {
  import type { PublicKey, Transaction } from "@solana/web3.js";
  import EventEmitter from "eventemitter3";

  export default class Wallet extends EventEmitter {
    private readonly _autoApprove;
    private readonly _beforeUnload;
    private readonly _handlerAdded;
    private readonly _injectedProvider?;
    private readonly _network;
    private readonly _nextRequestId;
    private readonly _popup;
    private readonly _providerUrl;
    private readonly _publicKey;
    private readonly _responsePromises;
    private readonly handleConnect;
    private readonly handleDisconnect;
    private readonly sendRequest;
    public constructor(provider: unknown, _network: string);
    public get publicKey(): PublicKey | null;
    public get connected(): boolean;
    public get autoApprove(): boolean;
    public handleMessage(
      e: MessageEvent<{
        readonly id: number;
        readonly method: string;
        readonly params: {
          readonly autoApprove: boolean;
          readonly publicKey: string;
        };
        readonly result?: string;
        readonly error?: string;
      }>,
    ): void;
    public connect(): Promise<void>;
    public disconnect(): Promise<void>;
    public sign(
      data: Uint8Array,
      display: unknown,
    ): Promise<{
      readonly signature: Buffer;
      readonly publicKey: PublicKey;
    }>;
    public signTransaction(transaction: Transaction): Promise<Transaction>;
    public signAllTransactions(
      transactions: readonly Transaction[],
    ): // eslint-disable-next-line functional/prefer-readonly-type
    Promise<Transaction[]>;
    public diffieHellman(publicKey: Uint8Array): Promise<{
      readonly publicKey: Uint8Array;
      readonly secretKey: Uint8Array;
    }>;
  }
}
