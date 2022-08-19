import type { Account as TokenAccount } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID, Token, u64 } from "@solana/spl-token";
import type { AccountMeta, Transaction } from "@solana/web3.js";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import { SOLANA_ECOSYSTEM_ID, createMemoIx } from "@swim-io/solana";
import { isEachNotNull } from "@swim-io/utils";

import type { Amount } from "../amount";
import type { SolanaConnection } from "../solana";
import { createTx, findTokenAccountForMint } from "../solana";
import type { SolanaWalletAdapter } from "../wallets";

import {
  SwimDefiInstruction,
  SwimInstruction,
  defiAddInstruction,
  defiRemoveExactBurnInstruction,
  defiRemoveExactOutputInstruction,
  defiRemoveUniformInstruction,
  defiSwapInstruction,
} from "./instructions";
import type {
  AddOperationSpec,
  RemoveExactBurnOperationSpec,
  RemoveExactOutputOperationSpec,
  RemoveUniformOperationSpec,
  SwapOperationSpec,
} from "./operation";

export class SwimDefiInstructor {
  readonly env: Env;
  readonly solanaConnection: SolanaConnection;
  readonly signer: SolanaWalletAdapter;
  readonly programId: PublicKey;
  readonly stateAccount: PublicKey;
  readonly poolAuthority: PublicKey;
  readonly lpMint: PublicKey;
  readonly governanceFeeAccount: PublicKey;
  readonly tokenMints: readonly PublicKey[];
  readonly poolTokenAccounts: readonly PublicKey[];
  userLpAccount: PublicKey | null;
  userTokenAccounts: readonly PublicKey[];

  constructor(
    env: Env,
    solanaConnection: SolanaConnection,
    signer: SolanaWalletAdapter,
    swimProgramAddress: string,
    stateAccount: string,
    poolAuthority: string,
    lpMint: string,
    governanceFeeAccount: string,
    tokenMints: readonly string[],
    poolTokenAccounts: readonly string[],
    userLpAccount?: string,
    userTokenAccounts?: readonly (string | null)[],
  ) {
    if (poolTokenAccounts.length !== tokenMints.length) {
      throw new Error(
        "Number of pool token accounts does not match number of token mints",
      );
    }
    if (userTokenAccounts && userTokenAccounts.length !== tokenMints.length) {
      throw new Error(
        "Number of user token accounts does not match number of token mints",
      );
    }
    this.env = env;
    this.solanaConnection = solanaConnection;
    this.signer = signer;
    this.programId = new PublicKey(swimProgramAddress);
    this.stateAccount = new PublicKey(stateAccount);
    this.poolAuthority = new PublicKey(poolAuthority);
    this.lpMint = new PublicKey(lpMint);
    this.governanceFeeAccount = new PublicKey(governanceFeeAccount);
    this.tokenMints = tokenMints.map((pubkey) => new PublicKey(pubkey));
    this.poolTokenAccounts = poolTokenAccounts.map(
      (pubkey) => new PublicKey(pubkey),
    );
    this.userLpAccount = userLpAccount ? new PublicKey(userLpAccount) : null;
    this.userTokenAccounts = userTokenAccounts
      ? userTokenAccounts.map((pubkey) =>
          pubkey ? new PublicKey(pubkey) : PublicKey.default,
        )
      : new Array(tokenMints.length).fill(PublicKey.default);
  }

  get numberOfTokens(): number {
    return this.tokenMints.length;
  }

  swapKeys(
    userTransferAuthority: PublicKey,
    ignorableUserTokenAccountIndices: readonly number[] = [],
  ): readonly AccountMeta[] {
    if (!isEachNotNull(this.userTokenAccounts)) {
      throw new Error("No user token accounts");
    }
    return [
      { pubkey: this.stateAccount, isSigner: false, isWritable: true },
      { pubkey: this.poolAuthority, isSigner: false, isWritable: false },
      ...this.poolTokenAccounts.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
      { pubkey: this.lpMint, isSigner: false, isWritable: true },
      { pubkey: this.governanceFeeAccount, isSigner: false, isWritable: true },
      { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
      // NOTE: This is a hack to reduce the tx size. Since irrelevant token accounts aren't
      // checked by the pool contract we can just reuse an account that's already present in the
      // tx header to save on space.
      ...this.userTokenAccounts.map((pubkey, i) => ({
        pubkey: ignorableUserTokenAccountIndices.includes(i)
          ? this.stateAccount
          : pubkey,
        isSigner: false,
        isWritable: true,
      })),
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
  }

  liquidityKeys(
    userTransferAuthority: PublicKey,
    ignorableUserTokenAccountIndices: readonly number[] = [],
  ): readonly AccountMeta[] {
    if (!this.userLpAccount) {
      throw new Error("No user LP account");
    }
    return [
      ...this.swapKeys(userTransferAuthority, ignorableUserTokenAccountIndices),
      { pubkey: this.userLpAccount, isSigner: false, isWritable: true },
    ];
  }

  isValidTokenIndex(index: number): boolean {
    return [...new Array(this.numberOfTokens).keys()].includes(index);
  }

  async add(
    operation: AddOperationSpec,
    splTokenAccounts: readonly TokenAccount[],
  ): Promise<string> {
    const { params } = operation;
    const tokenMintIndices = params.inputAmounts.reduce<readonly number[]>(
      (indices, amount, i) => (amount.isZero() ? indices : [...indices, i]),
      [],
    );
    this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts, true);

    const userTransferAuthority = Keypair.generate();
    const ixs = this.createAllAddIxs(operation, userTransferAuthority);

    return this.signAndSendTransactionForInstructions(
      ixs,
      userTransferAuthority,
    );
  }

  createAllAddIxs(
    { interactionId, params }: AddOperationSpec,
    userTransferAuthority: Keypair,
    includeMemo = true,
  ): readonly TransactionInstruction[] {
    const approveIxs = this.createApproveTokensIxs(
      params.inputAmounts,
      userTransferAuthority.publicKey,
    );
    const addIx = this.createAddIx(params, userTransferAuthority.publicKey);
    return includeMemo
      ? [...approveIxs, addIx, createMemoIx(interactionId, [])]
      : [...approveIxs, addIx];
  }

  async removeUniform(
    operation: RemoveUniformOperationSpec,
    splTokenAccounts: readonly TokenAccount[],
  ): Promise<string> {
    const tokenMintIndices = this.userTokenAccounts.map((_, i) => i);
    this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const ixs = this.createAllRemoveUniformIxs(
      operation,
      userTransferAuthority,
    );

    return this.signAndSendTransactionForInstructions(
      ixs,
      userTransferAuthority,
    );
  }

  createAllRemoveUniformIxs(
    { interactionId, params }: RemoveUniformOperationSpec,
    userTransferAuthority: Keypair,
    includeMemo = true,
  ): readonly TransactionInstruction[] {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }

    const approveIx = this.createApproveTokenIx(
      params.exactBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeUniformIx = this.createRemoveUniformIx(
      params,
      userTransferAuthority.publicKey,
    );

    return includeMemo
      ? [approveIx, removeUniformIx, createMemoIx(interactionId, [])]
      : [approveIx, removeUniformIx];
  }

  async removeExactBurn(
    operation: RemoveExactBurnOperationSpec,
    splTokenAccounts: readonly TokenAccount[],
  ): Promise<string> {
    const { params } = operation;
    const tokenMintIndices = [params.outputTokenIndex];
    this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const ixs = this.createAllRemoveExactBurnIxs(
      operation,
      userTransferAuthority,
    );

    return this.signAndSendTransactionForInstructions(
      ixs,
      userTransferAuthority,
    );
  }

  createAllRemoveExactBurnIxs(
    { interactionId, params }: RemoveExactBurnOperationSpec,
    userTransferAuthority: Keypair,
    includeMemo = true,
  ): readonly TransactionInstruction[] {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }
    const approveIx = this.createApproveTokenIx(
      params.exactBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeExactBurnIx = this.createRemoveExactBurnIx(
      params,
      userTransferAuthority.publicKey,
    );

    return includeMemo
      ? [approveIx, removeExactBurnIx, createMemoIx(interactionId, [])]
      : [approveIx, removeExactBurnIx];
  }

  async removeExactOutput(
    operation: RemoveExactOutputOperationSpec,
    splTokenAccounts: readonly TokenAccount[],
  ): Promise<string> {
    const { params } = operation;
    const tokenMintIndices = params.exactOutputAmounts.reduce<
      readonly number[]
    >(
      (indices, amount, i) => (amount.isZero() ? indices : [...indices, i]),
      [],
    );
    this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const ixs = this.createAllRemoveExactOutputIxs(
      operation,
      userTransferAuthority,
    );

    return this.signAndSendTransactionForInstructions(
      ixs,
      userTransferAuthority,
    );
  }

  createAllRemoveExactOutputIxs(
    { interactionId, params }: RemoveExactOutputOperationSpec,
    userTransferAuthority: Keypair,
    includeMemo = true,
  ): readonly TransactionInstruction[] {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }
    const approveIx = this.createApproveTokenIx(
      params.maximumBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeExactOutputIx = this.createRemoveExactOutputIx(
      params,
      userTransferAuthority.publicKey,
    );

    return includeMemo
      ? [approveIx, removeExactOutputIx, createMemoIx(interactionId, [])]
      : [approveIx, removeExactOutputIx];
  }

  async swap(
    operation: SwapOperationSpec,
    splTokenAccounts: readonly TokenAccount[],
  ): Promise<string> {
    const { params } = operation;
    const tokenMintIndices = params.exactInputAmounts.reduce<readonly number[]>(
      (indices, amount, i) =>
        amount.isZero() && i !== params.outputTokenIndex
          ? indices
          : [...indices, i],
      [],
    );
    this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const ixs = this.createAllSwapIxs(operation, userTransferAuthority);

    return this.signAndSendTransactionForInstructions(
      ixs,
      userTransferAuthority,
    );
  }

  createAllSwapIxs(
    { interactionId, params }: SwapOperationSpec,
    userTransferAuthority: Keypair,
    includeMemo = true,
  ): readonly TransactionInstruction[] {
    const approveIxs = this.createApproveTokensIxs(
      params.exactInputAmounts,
      userTransferAuthority.publicKey,
    );
    const swapIx = this.createSwapIx(params, userTransferAuthority.publicKey);
    return includeMemo
      ? [...approveIxs, swapIx, createMemoIx(interactionId, [])]
      : [...approveIxs, swapIx];
  }

  private createAddIx(
    { inputAmounts, minimumMintAmount }: AddOperationSpec["params"],
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (inputAmounts.length !== this.numberOfTokens) {
      throw new Error(`Must specify ${this.numberOfTokens} input amounts`);
    }
    const layout = defiAddInstruction(this.numberOfTokens);
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.DeFi,
        defiInstruction: SwimDefiInstruction.Add,
        inputAmounts: inputAmounts.map((amount) =>
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        ),
        minimumMintAmount: minimumMintAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      },
      data,
    );

    const ignorableUserTokenAccountIndices = inputAmounts.reduce<
      readonly number[]
    >(
      (indices, amount, i) => (amount.isZero() ? [...indices, i] : indices),
      [],
    );
    const keys = this.liquidityKeys(
      userTransferAuthority,
      ignorableUserTokenAccountIndices,
    );
    return new TransactionInstruction({
      keys: [...keys],
      programId: this.programId,
      data,
    });
  }

  private createRemoveUniformIx(
    {
      exactBurnAmount,
      minimumOutputAmounts,
    }: RemoveUniformOperationSpec["params"],
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (minimumOutputAmounts.length !== this.numberOfTokens) {
      throw new Error(
        `Must specify ${this.numberOfTokens} minimum output amounts`,
      );
    }

    const layout = defiRemoveUniformInstruction(this.numberOfTokens);
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.DeFi,
        defiInstruction: SwimDefiInstruction.RemoveUniform,
        exactBurnAmount: exactBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        minimumOutputAmounts: minimumOutputAmounts.map((amount) =>
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        ),
      },
      data,
    );

    return new TransactionInstruction({
      keys: [...this.liquidityKeys(userTransferAuthority)],
      programId: this.programId,
      data,
    });
  }

  private createRemoveExactBurnIx(
    {
      exactBurnAmount,
      outputTokenIndex,
      minimumOutputAmount,
    }: RemoveExactBurnOperationSpec["params"],
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (!this.isValidTokenIndex(outputTokenIndex)) {
      throw new Error(
        `Invalid output token index (${outputTokenIndex}) for pool with ${this.numberOfTokens} tokens`,
      );
    }

    const layout = defiRemoveExactBurnInstruction();
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.DeFi,
        defiInstruction: SwimDefiInstruction.RemoveExactBurn,
        exactBurnAmount: exactBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        outputTokenIndex,
        minimumOutputAmount:
          minimumOutputAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      },
      data,
    );

    return new TransactionInstruction({
      keys: [...this.liquidityKeys(userTransferAuthority)],
      programId: this.programId,
      data,
    });
  }

  private createRemoveExactOutputIx(
    {
      maximumBurnAmount,
      exactOutputAmounts,
    }: RemoveExactOutputOperationSpec["params"],
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (exactOutputAmounts.length !== this.numberOfTokens) {
      throw new Error(
        `Must specify ${this.numberOfTokens} exact output amounts`,
      );
    }

    const layout = defiRemoveExactOutputInstruction(this.numberOfTokens);
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.DeFi,
        defiInstruction: SwimDefiInstruction.RemoveExactOutput,
        maximumBurnAmount: maximumBurnAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        exactOutputAmounts: exactOutputAmounts.map((amount) =>
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        ),
      },
      data,
    );

    return new TransactionInstruction({
      keys: [...this.liquidityKeys(userTransferAuthority)],
      programId: this.programId,
      data,
    });
  }

  private createSwapIx(
    {
      exactInputAmounts,
      outputTokenIndex,
      minimumOutputAmount,
    }: SwapOperationSpec["params"],
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (exactInputAmounts.length !== this.numberOfTokens) {
      throw new Error(
        `Must specify ${this.numberOfTokens} exact input amounts`,
      );
    }
    if (!this.isValidTokenIndex(outputTokenIndex)) {
      throw new Error(
        `Invalid output token index (${outputTokenIndex}) for pool with ${this.numberOfTokens} tokens`,
      );
    }

    const layout = defiSwapInstruction(this.numberOfTokens);
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.DeFi,
        defiInstruction: SwimDefiInstruction.Swap,
        exactInputAmounts: exactInputAmounts.map((amount) =>
          amount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
        ),
        outputTokenIndex,
        minimumOutputAmount:
          minimumOutputAmount.toAtomicBn(SOLANA_ECOSYSTEM_ID),
      },
      data,
    );

    const ignorableUserTokenAccountIndices = exactInputAmounts.reduce<
      readonly number[]
    >(
      (indices, amount, i) =>
        i !== outputTokenIndex && amount.isZero() ? [...indices, i] : indices,
      [],
    );
    const keys = this.swapKeys(
      userTransferAuthority,
      ignorableUserTokenAccountIndices,
    );
    return new TransactionInstruction({
      keys: [...keys],
      programId: this.programId,
      data,
    });
  }

  private createApproveTokenIx(
    amount: Amount,
    tokenAccount: PublicKey,
    userTransferAuthority: PublicKey,
  ): TransactionInstruction {
    if (!this.signer.publicKey) {
      throw new Error("Missing Solana public key");
    }
    return Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      tokenAccount,
      userTransferAuthority,
      this.signer.publicKey,
      [],
      // See https://github.com/solana-labs/solana-program-library/issues/2563
      new u64(amount.toAtomicString(SOLANA_ECOSYSTEM_ID)),
    );
  }

  private createApproveTokensIxs(
    amounts: readonly Amount[],
    userTransferAuthority: PublicKey,
  ): readonly TransactionInstruction[] {
    return amounts.reduce<readonly TransactionInstruction[]>(
      (ixs, amount, i) => {
        if (amount.isZero()) {
          return ixs;
        }
        const userTokenAccount = this.userTokenAccounts[i];
        if (userTokenAccount.equals(this.stateAccount)) {
          throw new Error("Missing user token account");
        }
        const ix = this.createApproveTokenIx(
          amount,
          userTokenAccount,
          userTransferAuthority,
        );
        return [...ixs, ix];
      },
      [],
    );
  }

  private async signAndSendTransaction(
    tx: Transaction,
    userTransferAuthority: Keypair,
  ): Promise<string> {
    const signTransaction = async (
      txToSign: Transaction,
    ): Promise<Transaction> => {
      txToSign.partialSign(userTransferAuthority);
      return this.signer.signTransaction(txToSign);
    };
    return this.solanaConnection.sendAndConfirmTx(signTransaction, tx);
  }

  private async signAndSendTransactionForInstructions(
    ixs: readonly TransactionInstruction[],
    userTransferAuthority: Keypair,
  ): Promise<string> {
    if (!this.signer.publicKey) {
      throw new Error("No wallet public key");
    }
    const tx = createTx({
      feePayer: this.signer.publicKey,
    });
    tx.add(...ixs);
    return this.signAndSendTransaction(tx, userTransferAuthority);
  }

  private ensureUserTokenAccounts(
    tokenMintIndices: readonly number[],
    splTokenAccounts: readonly TokenAccount[],
    isLpTokenAccountNeeded = false,
  ): void {
    if (!this.signer.publicKey) {
      throw new Error("No wallet public key");
    }
    const signerAddress = this.signer.publicKey.toBase58();
    const relevantTokenMints = tokenMintIndices.map((i) => this.tokenMints[i]);
    const userLpTokenAccount = isLpTokenAccountNeeded
      ? findTokenAccountForMint(
          this.lpMint.toBase58(),
          signerAddress,
          splTokenAccounts,
        )
      : null;
    if (isLpTokenAccountNeeded && userLpTokenAccount === null) {
      throw new Error(
        `Missing token account for mint ${this.lpMint.toBase58()}`,
      );
    }
    const userTokenAccounts = relevantTokenMints.map((mint) => {
      const account = findTokenAccountForMint(
        mint.toBase58(),
        signerAddress,
        splTokenAccounts,
      );
      if (account === null) {
        throw new Error(`Missing token account for mint ${mint.toBase58()}`);
      }
      return account;
    });
    this.userLpAccount = userLpTokenAccount?.address ?? this.userLpAccount;
    this.userTokenAccounts = this.userTokenAccounts.map((account, i) => {
      const j = tokenMintIndices.findIndex((index) => index === i);
      return j === -1 ? account : userTokenAccounts[j].address;
    });
  }
}
