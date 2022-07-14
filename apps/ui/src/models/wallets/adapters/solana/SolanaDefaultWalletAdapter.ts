import Wallet from "@project-serum/sol-wallet-adapter";
import { SOLANA_PROTOCOL } from "@swim-io/plugin-ecosystem-solana";

import type { SolanaWalletAdapter } from "./SolanaWalletAdapter";

export class SolanaDefaultWalletAdapter
  extends Wallet
  implements SolanaWalletAdapter
{
  readonly protocol: SOLANA_PROTOCOL;

  constructor(provider: unknown, network: string) {
    super(provider, network);
    this.protocol = SOLANA_PROTOCOL;
  }

  public get address(): string | null {
    return this.publicKey?.toBase58() || null;
  }
}
