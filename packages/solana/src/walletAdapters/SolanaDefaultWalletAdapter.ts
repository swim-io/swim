import Wallet from "@project-serum/sol-wallet-adapter";

import type { SolanaProtocol } from "../protocol";
import { SOLANA_PROTOCOL } from "../protocol";

import type { SolanaWalletAdapter } from "./SolanaWalletAdapter";

export class SolanaDefaultWalletAdapter
  extends Wallet
  implements SolanaWalletAdapter
{
  public readonly protocol: SolanaProtocol;
  public readonly serviceName = "SolanaDefault";

  public constructor(provider: unknown, network: string) {
    super(provider, network);
    this.protocol = SOLANA_PROTOCOL;
  }

  public get address(): string | null {
    return this.publicKey?.toBase58() || null;
  }
}
