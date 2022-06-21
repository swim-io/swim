import type { PublicKey, Transaction } from "@solana/web3.js";

import { SolanaWeb3WalletAdapter } from "./SolanaWalletAdapter";

type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

interface PhantomProvider {
  readonly publicKey?: PublicKey;
  readonly isConnected?: boolean;
  readonly autoApprove?: boolean;
  readonly signTransaction: (transaction: Transaction) => Promise<Transaction>;
  readonly signAllTransactions: (
    transactions: readonly Transaction[],
  ) => Promise<readonly Transaction[]>;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly on: (event: PhantomEvent, handler: (args: any) => void) => void;
  readonly request: (method: PhantomRequestMethod, params: any) => Promise<any>;
  readonly listeners: (event: PhantomEvent) => readonly (() => void)[];
}

const getPhantomService = (): PhantomProvider =>
  (window as any).solana?.isPhantom ? (window as any).solana : null;

export class PhantomAdapter extends SolanaWeb3WalletAdapter {
  constructor() {
    super("Phantom", "https://phantom.app", getPhantomService);
  }

  async connectService(args?: any): Promise<void> {
    // note the listener is on the service, not the adapter
    this.service.on("connect", () => {
      this.publicKey = this.service.publicKey;
      this.emit("connect", this.publicKey);

      this.connecting = false;
    });

    if (!this.service.isConnected) {
      await this.service.connect(args);
    }
  }

  async disconnect(): Promise<void> {
    if (this.service) {
      await this.service.disconnect();
    }
    await super.disconnect();
  }
}
