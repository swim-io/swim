import {
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import type { AccountMeta, Transaction } from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import type { DecimalBN } from "@swim-io/solana";
import { swimPool } from "@swim-io/solana";
import { chunks } from "@swim-io/utils";

import type { SolanaConnection } from "../solana";
import { createSplTokenAccount, createTx, findProgramAddress } from "../solana";
import type { SolanaWalletAdapter } from "../wallets";

import { SwimInstruction, initInstruction } from "./instructions";

export class SwimInitializer {
  solanaConnection: SolanaConnection;
  signer: SolanaWalletAdapter;
  programId: PublicKey;
  tokenMints: readonly PublicKey[];
  governanceAccount: PublicKey;
  governanceFeeAccount: PublicKey | null;
  stateAccount: PublicKey | null;
  poolAuthority: PublicKey | null;
  nonce: number | null;
  lpMint: PublicKey | null;
  tokenAccounts: readonly PublicKey[] | null;

  constructor(
    solanaConnection: SolanaConnection,
    signer: SolanaWalletAdapter,
    swimProgramAddress: string,
    tokenMintAddresses: readonly string[],
    governanceAddress: string,
  ) {
    this.solanaConnection = solanaConnection;
    this.signer = signer;
    this.programId = new PublicKey(swimProgramAddress);
    this.tokenMints = tokenMintAddresses.map((mint) => new PublicKey(mint));
    this.governanceAccount = new PublicKey(governanceAddress);
    this.governanceFeeAccount = null;
    this.stateAccount = null;
    this.poolAuthority = null;
    this.nonce = null;
    this.lpMint = null;
    this.tokenAccounts = null;
  }

  get numberOfTokens(): number {
    return this.tokenMints.length;
  }

  async initialize(
    lpTokenDecimals: number,
    ampFactor: DecimalBN,
    lpFee: DecimalBN,
    governanceFee: DecimalBN,
    stateSecretKey?: Uint8Array,
    lpMintSecretKey?: Uint8Array,
    tokenAccountSecretKeys?: readonly Uint8Array[],
  ): Promise<readonly string[]> {
    if (
      tokenAccountSecretKeys &&
      tokenAccountSecretKeys.length !== this.numberOfTokens
    ) {
      throw new Error(
        "Number of token account secret keys does not match number of tokens",
      );
    }
    const signerAddress = this.signer.publicKey?.toBase58() ?? null;
    if (signerAddress === null) {
      throw new Error("Missing signer address");
    }

    const stateKeypair = stateSecretKey
      ? Keypair.fromSecretKey(stateSecretKey)
      : Keypair.generate();
    this.stateAccount = stateKeypair.publicKey;

    const lpMintKeypair = lpMintSecretKey
      ? Keypair.fromSecretKey(lpMintSecretKey)
      : Keypair.generate();
    this.lpMint = lpMintKeypair.publicKey;

    const tokenAccountKeypairs =
      tokenAccountSecretKeys?.map((secretKey) =>
        Keypair.fromSecretKey(secretKey),
      ) ??
      Array.from({ length: this.numberOfTokens }).map(() => Keypair.generate());
    this.tokenAccounts = tokenAccountKeypairs.map(
      (keypair) => keypair.publicKey,
    );

    // More than 4 (or maybe 5?) makes the tx too large
    const groupedTokenAccountKeypairs = chunks(tokenAccountKeypairs, 4);
    const txIdLpSetup = await this.setupStateAndLpToken(
      lpTokenDecimals,
      stateKeypair,
      lpMintKeypair,
    );
    const txIdPrepareLpTokenAccount = await createSplTokenAccount(
      this.solanaConnection,
      this.signer,
      this.lpMint.toBase58(),
    );
    this.governanceFeeAccount = await getAssociatedTokenAddress(
      this.lpMint,
      new PublicKey(signerAddress),
    );

    let txIdsPrepareTokenAccounts: readonly string[] = [];
    let i = 0;
    for (const keypairGroup of groupedTokenAccountKeypairs) {
      txIdsPrepareTokenAccounts = [
        ...txIdsPrepareTokenAccounts,
        await this.prepareTokenAccounts(
          keypairGroup,
          this.tokenMints.slice(i * 4, (i + 1) * 4),
        ),
      ];
      ++i;
    }
    const txIdInitPool = await this.initPool(ampFactor, lpFee, governanceFee);
    return [
      txIdLpSetup,
      txIdPrepareLpTokenAccount,
      ...txIdsPrepareTokenAccounts,
      txIdInitPool,
    ];
  }

  private async createCreateStateAccountIx(): Promise<TransactionInstruction> {
    if (!this.signer.publicKey) {
      throw new Error("No wallet public key");
    }
    if (!this.stateAccount) {
      throw new Error("No state account");
    }
    const layout = swimPool(this.numberOfTokens);
    const lamports =
      await this.solanaConnection.getMinimumBalanceForRentExemption(
        layout.span,
      );
    return SystemProgram.createAccount({
      fromPubkey: this.signer.publicKey,
      newAccountPubkey: this.stateAccount,
      lamports: lamports,
      space: layout.span,
      programId: this.programId,
    });
  }

  private createMintInitIx(decimals: number): TransactionInstruction {
    if (!this.poolAuthority) {
      throw new Error("No pool authority");
    }
    if (!this.lpMint) {
      throw new Error("No LP mint");
    }
    return createInitializeMintInstruction(
      this.lpMint,
      decimals,
      this.poolAuthority,
      null,
    );
  }

  private createPoolInitIx(
    ampFactor: DecimalBN,
    lpFee: DecimalBN,
    governanceFee: DecimalBN,
  ): TransactionInstruction {
    if (!this.stateAccount) {
      throw new Error("No state account");
    }
    if (this.nonce === null) {
      throw new Error("No nonce");
    }
    if (!this.tokenAccounts) {
      throw new Error("No token accounts");
    }
    if (!this.lpMint) {
      throw new Error("No LP mint");
    }
    if (!this.governanceFeeAccount) {
      throw new Error("No governance fee account");
    }

    const layout = initInstruction();
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.Init,
        nonce: this.nonce,
        ampFactor,
        lpFee,
        governanceFee,
      },
      data,
    );

    const keys: readonly AccountMeta[] = [
      { pubkey: this.stateAccount, isSigner: false, isWritable: true },
      {
        pubkey: this.lpMint,
        isSigner: false,
        isWritable: false,
      },
      ...this.tokenMints.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: false,
      })),
      ...this.tokenAccounts.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: false,
      })),
      {
        pubkey: this.governanceAccount,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.governanceFeeAccount,
        isSigner: false,
        isWritable: false,
      },
    ];

    return new TransactionInstruction({
      keys: [...keys],
      programId: this.programId,
      data,
    });
  }

  private getFreshTransaction(): Transaction {
    return createTx({
      feePayer: this.signer.publicKey,
    });
  }

  private async signAndSendTransaction(
    tx: Transaction,
    keypairs: readonly Keypair[] = [],
  ): Promise<string> {
    if (!this.signer.publicKey) {
      throw new Error("No wallet public key");
    }
    const partialSignWrapper = async (
      txToSign: Transaction,
    ): Promise<Transaction> => {
      if (keypairs.length > 0) {
        txToSign.partialSign(...keypairs);
      }
      return this.signer.signTransaction(txToSign);
    };
    return this.solanaConnection.sendAndConfirmTx(partialSignWrapper, tx);
  }

  private async setupStateAndLpToken(
    lpTokenDecimals: number,
    stateKeypair: Keypair,
    lpMintKeypair: Keypair,
  ): Promise<string> {
    if (!this.signer.publicKey) {
      throw new Error("No wallet public key");
    }

    if (!this.stateAccount) {
      throw new Error("No state account");
    }
    const [poolAuthority, nonce] = findProgramAddress(
      [this.stateAccount.toBuffer()],
      this.programId,
    );
    this.poolAuthority = poolAuthority;
    this.nonce = nonce;
    const createMintLamports = await getMinimumBalanceForRentExemptMint(
      this.solanaConnection.rawConnection,
    );

    const createStateAccountIx = await this.createCreateStateAccountIx();
    const createLpTokenAccountIx = SystemProgram.createAccount({
      fromPubkey: this.signer.publicKey,
      newAccountPubkey: lpMintKeypair.publicKey,
      lamports: createMintLamports,
      // missing `span` in `Layout` type

      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
    const initMintIx = this.createMintInitIx(lpTokenDecimals);

    const tx = this.getFreshTransaction();
    tx.add(createStateAccountIx, createLpTokenAccountIx, initMintIx);
    return this.signAndSendTransaction(tx, [stateKeypair, lpMintKeypair]);
  }

  private async prepareTokenAccounts(
    tokenAccountKeypairs: readonly Keypair[],
    tokenMints: readonly PublicKey[],
  ): Promise<string> {
    const createAccountLamports = await getMinimumBalanceForRentExemptAccount(
      this.solanaConnection.rawConnection,
    );

    const { instructions, keypairs } = tokenMints.reduce<{
      readonly instructions: readonly TransactionInstruction[];
      readonly keypairs: readonly Keypair[];
    }>(
      (
        { instructions: instructionsInner, keypairs: keypairsInner },
        tokenMint,
        i,
      ) => {
        if (!this.signer.publicKey) {
          throw new Error("No wallet public key");
        }
        if (!this.poolAuthority) {
          throw new Error("No pool authority");
        }
        const tokenKeypair = tokenAccountKeypairs[i];
        const createAccountIx = SystemProgram.createAccount({
          fromPubkey: this.signer.publicKey,
          newAccountPubkey: tokenKeypair.publicKey,
          lamports: createAccountLamports,
          // missing `span` in `Layout` type

          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        });

        const initAccountIx = createInitializeAccountInstruction(
          tokenKeypair.publicKey,
          tokenMint,
          this.poolAuthority,
        );

        return {
          instructions: [...instructionsInner, createAccountIx, initAccountIx],
          keypairs: [...keypairsInner, tokenKeypair],
        };
      },
      { instructions: [], keypairs: [] },
    );

    const tx = this.getFreshTransaction();
    tx.add(...instructions);
    return this.signAndSendTransaction(tx, keypairs);
  }

  private async initPool(
    ampFactor: DecimalBN,
    lpFee: DecimalBN,
    governanceFee: DecimalBN,
  ): Promise<string> {
    const initPoolIx = this.createPoolInitIx(ampFactor, lpFee, governanceFee);

    const tx = this.getFreshTransaction();
    tx.add(initPoolIx);
    return this.signAndSendTransaction(tx);
  }
}
