import type { PublicKey } from "@solana/web3.js";

import { SolanaWeb3WalletAdapter } from "./SolanaWalletAdapter";
import type { SolanaWeb3WalletService } from "./SolanaWalletAdapter";

type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

interface PhantomProvider extends SolanaWeb3WalletService {
  readonly publicKey: PublicKey;
  readonly isConnected?: boolean;
  readonly autoApprove?: boolean;
  readonly connect: (args?: any) => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly on: (event: PhantomEvent, handler: (args: any) => void) => void;
  readonly request: (method: PhantomRequestMethod, params: any) => Promise<any>;
  readonly listeners: (event: PhantomEvent) => readonly (() => void)[];
}

const getPhantomService = (): PhantomProvider | null =>
  window.solana?.isPhantom ? (window.solana as PhantomProvider) : null;

export class PhantomAdapter extends SolanaWeb3WalletAdapter<PhantomProvider> {
  constructor() {
    super("Phantom", "https://phantom.app", getPhantomService);
  }

  async connectService(args?: any): Promise<void> {
    // may need to handle if service does not exist
    if (!this.service) return;

    // note the listener is on the service, not the adapter
    this.service.on("connect", () => {
      if (!this.service) return;

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
