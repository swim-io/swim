import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { TwoPool } from "./artifacts/two_pool";
import TwoPoolIDL from "./artifacts/two_pool.json";
import { ConfirmOptions, Connection, PublicKey } from "@solana/web3.js";


export class TwoPoolContext {
  readonly connection: Connection;
  readonly wallet: Wallet;
  readonly opts: ConfirmOptions;
  readonly program: Program<TwoPool>;
  readonly provider: AnchorProvider;

  public static from(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): TwoPoolContext {
    const anchorProvider = new AnchorProvider(connection, wallet, opts);
    const program = new Program(TwoPoolIDL as Idl, programId, anchorProvider);
    return new TwoPoolContext(
      anchorProvider,
      anchorProvider.wallet,
      program,
      opts
    );
  }

  public static fromWorkspace(
    provider: AnchorProvider,
    program: Program,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    return new TwoPoolContext(provider, provider.wallet, program, opts);
  }

  public static withProvider(
    provider: AnchorProvider,
    programId: PublicKey,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): TwoPoolContext {
    const program = new Program(TwoPoolIDL as Idl, programId, provider);
    return new TwoPoolContext(provider, provider.wallet, program, opts);
  }

  public constructor(
    provider: AnchorProvider,
    wallet: Wallet,
    program: Program,
    opts: ConfirmOptions
  ) {
    this.connection = provider.connection;
    this.wallet = wallet;
    this.opts = opts;
    // It's a hack but it works on Anchor workspace *shrug*
    this.program = program as unknown as Program<TwoPool>;
    this.provider = provider;
  }


}


