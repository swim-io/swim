import type { Idl } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { ConfirmOptions, Connection, PublicKey } from "@solana/web3.js";

import type { TwoPool } from "./artifacts/two_pool";
import TwoPoolIDL from "./artifacts/two_pool.json";

export class TwoPoolContext {
  public readonly connection: Connection;
  public readonly wallet: Wallet;
  public readonly opts: ConfirmOptions;
  public readonly program: Program<TwoPool>;
  public readonly provider: AnchorProvider;

  public constructor(
    provider: AnchorProvider,
    wallet: Wallet,
    program: Program,
    opts: ConfirmOptions,
  ) {
    this.connection = provider.connection;
    this.wallet = wallet;
    this.opts = opts;
    // It's a hack but it works on Anchor workspace *shrug*
    this.program = program as unknown as Program<TwoPool>;
    this.provider = provider;
  }

  public static from(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey,
    opts: ConfirmOptions = AnchorProvider.defaultOptions(),
  ): TwoPoolContext {
    const anchorProvider = new AnchorProvider(connection, wallet, opts);
    const program = new Program(TwoPoolIDL as Idl, programId, anchorProvider);
    return new TwoPoolContext(
      anchorProvider,
      anchorProvider.wallet,
      program,
      opts,
    );
  }

  public static fromWorkspace(
    provider: AnchorProvider,
    program: Program,
    opts: ConfirmOptions = AnchorProvider.defaultOptions(),
  ) {
    return new TwoPoolContext(provider, provider.wallet, program, opts);
  }

  public static withProvider(
    provider: AnchorProvider,
    programId: PublicKey,
    opts: ConfirmOptions = AnchorProvider.defaultOptions(),
  ): TwoPoolContext {
    const program = new Program(TwoPoolIDL as Idl, programId, provider);
    return new TwoPoolContext(provider, provider.wallet, program, opts);
  }
}
