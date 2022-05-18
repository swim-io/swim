import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID, Token, u64 } from "@solana/spl-token";
import type { AccountMeta } from "@solana/web3.js";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import type { Env } from "../../config";
import { EcosystemId } from "../../config";
import { isEachNotNull } from "../../utils";
import type { Amount } from "../amount";
import type { SolanaConnection } from "../solana";
import { createMemoIx, findTokenAccountForMint } from "../solana";
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
  AddPoolInteraction,
  RemoveExactBurnPoolInteraction,
  RemoveExactOutputPoolInteraction,
  RemoveUniformPoolInteraction,
  SwapPoolInteraction,
  WithSplTokenAccounts,
} from "./interaction";

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

  swapKeys(userTransferAuthority: PublicKey): readonly AccountMeta[] {
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
      ...this.userTokenAccounts.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
  }

  liquidityKeys(userTransferAuthority: PublicKey): readonly AccountMeta[] {
    if (!this.userLpAccount) {
      throw new Error("No user LP account");
    }
    return [
      ...this.swapKeys(userTransferAuthority),
      { pubkey: this.userLpAccount, isSigner: false, isWritable: true },
    ];
  }

  isValidTokenIndex(index: number): boolean {
    return [...new Array(this.numberOfTokens).keys()].includes(index);
  }

  async add({
    id,
    splTokenAccounts,
    params,
  }: WithSplTokenAccounts<AddPoolInteraction>): Promise<string> {
    const tokenMintIndices = params.inputAmounts.reduce<readonly number[]>(
      (indices, amount, i) => (amount.isZero() ? indices : [...indices, i]),
      [],
    );
    await this.ensureUserTokenAccounts(
      tokenMintIndices,
      splTokenAccounts,
      true,
    );

    const userTransferAuthority = Keypair.generate();
    const approveIxs = this.createApproveTokensIxs(
      params.inputAmounts,
      userTransferAuthority.publicKey,
    );
    const addIx = this.createAddIx(params, userTransferAuthority.publicKey);
    const memoIx = createMemoIx(id, []);

    return this.signAndSendTransactionForInstructions(
      [...approveIxs, addIx, memoIx],
      userTransferAuthority,
    );
  }

  async removeUniform({
    id,
    splTokenAccounts,
    params,
  }: WithSplTokenAccounts<RemoveUniformPoolInteraction>): Promise<string> {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }
    const tokenMintIndices = this.userTokenAccounts.map((_, i) => i);
    await this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const approveIx = this.createApproveTokenIx(
      params.exactBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeUniformIx = this.createRemoveUniformIx(
      params,
      userTransferAuthority.publicKey,
    );
    const memoIx = createMemoIx(id, []);

    return this.signAndSendTransactionForInstructions(
      [approveIx, removeUniformIx, memoIx],
      userTransferAuthority,
    );
  }

  async removeExactBurn({
    id,
    splTokenAccounts,
    params,
  }: WithSplTokenAccounts<RemoveExactBurnPoolInteraction>): Promise<string> {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }
    const tokenMintIndices = [params.outputTokenIndex];
    await this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const approveIx = this.createApproveTokenIx(
      params.exactBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeExactBurnIx = this.createRemoveExactBurnIx(
      params,
      userTransferAuthority.publicKey,
    );
    const memoIx = createMemoIx(id, []);

    return this.signAndSendTransactionForInstructions(
      [approveIx, removeExactBurnIx, memoIx],
      userTransferAuthority,
    );
  }

  async removeExactOutput({
    id,
    splTokenAccounts,
    params,
  }: WithSplTokenAccounts<RemoveExactOutputPoolInteraction>): Promise<string> {
    if (!this.userLpAccount) {
      throw new Error("Missing user LP account");
    }
    const tokenMintIndices = params.exactOutputAmounts.reduce<
      readonly number[]
    >(
      (indices, amount, i) => (amount.isZero() ? indices : [...indices, i]),
      [],
    );
    await this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const approveIx = this.createApproveTokenIx(
      params.maximumBurnAmount,
      this.userLpAccount,
      userTransferAuthority.publicKey,
    );
    const removeExactOutputIx = this.createRemoveExactOutputIx(
      params,
      userTransferAuthority.publicKey,
    );
    const memoIx = createMemoIx(id, []);

    return this.signAndSendTransactionForInstructions(
      [approveIx, removeExactOutputIx, memoIx],
      userTransferAuthority,
    );
  }

  async swap({
    id,
    splTokenAccounts,
    params,
  }: WithSplTokenAccounts<SwapPoolInteraction>): Promise<string> {
    const tokenMintIndices = params.exactInputAmounts.reduce<readonly number[]>(
      (indices, amount, i) =>
        amount.isZero() && i !== params.outputTokenIndex
          ? indices
          : [...indices, i],
      [],
    );
    await this.ensureUserTokenAccounts(tokenMintIndices, splTokenAccounts);

    const userTransferAuthority = Keypair.generate();
    const approveIxs = this.createApproveTokensIxs(
      params.exactInputAmounts,
      userTransferAuthority.publicKey,
    );
    const swapIx = this.createSwapIx(params, userTransferAuthority.publicKey);
    const memoIx = createMemoIx(id, []);

    return this.signAndSendTransactionForInstructions(
      [...approveIxs, swapIx, memoIx],
      userTransferAuthority,
    );
  }

  private createAddIx(
    { inputAmounts, minimumMintAmount }: AddPoolInteraction["params"],
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
          amount.toAtomicBn(EcosystemId.Solana),
        ),
        minimumMintAmount: minimumMintAmount.toAtomicBn(EcosystemId.Solana),
      },
      data,
    );

    return new TransactionInstruction({
      keys: [...this.liquidityKeys(userTransferAuthority)],
      programId: this.programId,
      data,
    });
  }

  private createRemoveUniformIx(
    {
      exactBurnAmount,
      minimumOutputAmounts,
    }: RemoveUniformPoolInteraction["params"],
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
        exactBurnAmount: exactBurnAmount.toAtomicBn(EcosystemId.Solana),
        minimumOutputAmounts: minimumOutputAmounts.map((amount) =>
          amount.toAtomicBn(EcosystemId.Solana),
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
    }: RemoveExactBurnPoolInteraction["params"],
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
        exactBurnAmount: exactBurnAmount.toAtomicBn(EcosystemId.Solana),
        outputTokenIndex,
        minimumOutputAmount: minimumOutputAmount.toAtomicBn(EcosystemId.Solana),
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
    }: RemoveExactOutputPoolInteraction["params"],
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
        maximumBurnAmount: maximumBurnAmount.toAtomicBn(EcosystemId.Solana),
        exactOutputAmounts: exactOutputAmounts.map((amount) =>
          amount.toAtomicBn(EcosystemId.Solana),
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
    }: SwapPoolInteraction["params"],
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
          amount.toAtomicBn(EcosystemId.Solana),
        ),
        outputTokenIndex,
        minimumOutputAmount: minimumOutputAmount.toAtomicBn(EcosystemId.Solana),
      },
      data,
    );

    return new TransactionInstruction({
      keys: [...this.swapKeys(userTransferAuthority)],
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
      new u64(amount.toAtomicString(EcosystemId.Solana)),
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
        if (userTokenAccount.equals(PublicKey.default)) {
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
    const tx = new Transaction({
      feePayer: this.signer.publicKey,
    });
    tx.add(...ixs);
    return this.signAndSendTransaction(tx, userTransferAuthority);
  }

  private async ensureUserTokenAccounts(
    tokenMintIndices: readonly number[],
    splTokenAccounts: readonly TokenAccount[],
    isLpTokenAccountNeeded = false,
  ): Promise<void> {
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
