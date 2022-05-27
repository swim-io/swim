import Wallet from "@project-serum/sol-wallet-adapter";

import { Protocol } from "../../../../config";

import type { SolanaWalletAdapter } from "./SolanaWalletAdapter";

export class SolanaDefaultWalletAdapter
  extends Wallet
  implements SolanaWalletAdapter
{
  readonly protocol: Protocol.Solana;

  constructor(provider: unknown, network: string) {
    super(provider, network);
    this.protocol = Protocol.Solana;
  }

  public get address(): string | null {
    return this.publicKey?.toBase58() || null;
  }
}
