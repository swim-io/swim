import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
  Signer,
  AccountMeta,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  getMint,
  createMint,
  createApproveInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import type BN from "bn.js";

import { Timestamp, Decimal } from "./common";
import {
  toAccountMeta,
  createAccount,
  createAssociatedTokenAccount,
} from "./utils";
import {
  getPoolState,
  PoolState,
  MutableStateData,
  programIdFromTokenCount,
  dataSizeFromTokenCount,
} from "./poolState";
import { ToPool } from "./poolConversion";
import {
  SwimInstruction,
  SwimDefiInstruction,
  SwimGovernanceInstruction,
  initInstruction,
  addInstruction,
  removeExactBurnInstruction,
  removeExactOutputInstruction,
  removeUniformInstruction,
  swapInstruction,
  prepareFeeChangeInstruction,
  enactFeeChangeInstruction,
  prepareGovernanceTransitionInstruction,
  enactGovernanceTransitionInstruction,
  changeGovernanceFeeAccountInstruction,
  adjustAmpFactorInstruction,
  setPausedInstruction,
} from "./from_ui_modified/instructions";

export class PoolInstructor {
  readonly programId: PublicKey;

  constructor(
    readonly connection: Connection,
    readonly payer: Signer,
    readonly stateKey: PublicKey,
    readonly authority: PublicKey,
    readonly lpMintKey: PublicKey,
    readonly governanceKey: PublicKey,
    readonly governanceFeeKey: PublicKey,
    readonly lpMintDecimals: number,
    readonly tokenMintKeys: readonly PublicKey[],
    readonly tokenDecimals: readonly number[],
    readonly tokenKeys: readonly PublicKey[],
  ) {
    if (
      tokenMintKeys.length != tokenDecimals.length ||
      tokenDecimals.length != tokenKeys.length
    )
      throw new Error("array length mismatch");

    this.programId = programIdFromTokenCount(this.tokenCount);
  }

  static async fromPoolState(
    connection: Connection,
    payer: Signer,
    poolState: PoolState,
  ): Promise<PoolInstructor> {
    const lpMintDecimals = (await getMint(connection, poolState.lpMintKey))
      .decimals;
    const maxDecimals = lpMintDecimals + poolState.lpDecimalEqualizer;

    return new PoolInstructor(
      connection,
      payer,
      poolState.address,
      poolState.authority,
      poolState.lpMintKey,
      poolState.governanceKey,
      poolState.governanceFeeKey,
      lpMintDecimals,
      poolState.tokenMintKeys,
      poolState.tokenDecimalEqualizers.map(
        (equalizer) => maxDecimals - equalizer,
      ),
      poolState.tokenKeys,
    );
  }

  static async deployPool(
    connection: Connection,
    payer: Signer,
    mintKeys: readonly PublicKey[],
    governanceKey: PublicKey,
    lpMintDecimals: number,
    ampFactor: Decimal,
    lpFee: Decimal,
    governanceFee: Decimal,
    statePair: Keypair = Keypair.generate(),
    lpMintPair: Keypair = Keypair.generate(),
  ): Promise<PoolInstructor> {
    const tokenCount = mintKeys.length;
    const programId = programIdFromTokenCount(tokenCount);

    await createAccount(
      connection,
      payer,
      dataSizeFromTokenCount(tokenCount),
      programId,
      statePair,
    );

    const [authority, nonce] = await PublicKey.findProgramAddress(
      [statePair.publicKey.toBuffer()],
      programId,
    );

    const lpMint = await createMint(
      connection,
      payer,
      authority,
      null,
      lpMintDecimals,
      lpMintPair,
    );
    const governanceFeeKey =
      lpFee.isZero() && governanceFee.isZero()
        ? PublicKey.default
        : await createAssociatedTokenAccount(
            connection,
            payer,
            lpMint,
            governanceKey,
          );

    const tokenKeysWithDecimals = await Promise.all(
      mintKeys.map(async (mintKey) => {
        const mint = await getMint(connection, mintKey);
        return {
          key: await createAssociatedTokenAccount(
            connection,
            payer,
            mint.address,
            authority,
            true,
          ),
          decimals: mint.decimals,
        };
      }),
    );
    const tokenKeys = tokenKeysWithDecimals.map((keyDecimal) => keyDecimal.key);
    const tokenDecimals = tokenKeysWithDecimals.map(
      (keyDecimal) => keyDecimal.decimals,
    );

    const layout = initInstruction();
    const data = Buffer.alloc(layout.span);
    layout.encode(
      {
        instruction: SwimInstruction.Init,
        nonce,
        ampFactor: ToPool.decimal(ampFactor),
        lpFee: ToPool.fee(lpFee),
        governanceFee: ToPool.fee(governanceFee),
      },
      data,
    );

    const keys: AccountMeta[] = [
      toAccountMeta(statePair.publicKey, true),
      ...[
        lpMint,
        ...mintKeys,
        ...tokenKeys,
        governanceKey,
        governanceFeeKey,
      ].map((key) => toAccountMeta(key)),
    ];
    const initIx = new TransactionInstruction({ keys, programId, data });

    await sendAndConfirmTransaction(connection, new Transaction().add(initIx), [
      payer,
    ]);

    return new PoolInstructor(
      connection,
      payer,
      statePair.publicKey,
      authority,
      lpMint,
      governanceKey,
      governanceFeeKey,
      lpMintDecimals,
      mintKeys,
      tokenDecimals,
      tokenKeys,
    );
  }

  static async fromStateKey(
    connection: Connection,
    payer: Signer,
    stateKey: PublicKey,
  ): Promise<PoolInstructor> {
    const poolState = await getPoolState(connection, stateKey);
    return PoolInstructor.fromPoolState(connection, payer, poolState);
  }

  get tokenCount(): number {
    return this.tokenKeys.length;
  }

  async getState(): Promise<MutableStateData> {
    //TODO preferably we'd like to filter out all the constant data from the pool state to return
    //an object that truly only has the properties as defined in MutableStateData...
    return await getPoolState(this.connection, this.stateKey);
  }

  createAddIx(
    inputAmounts: readonly Decimal[],
    minimumMintAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
    userLpKey: PublicKey,
  ): TransactionInstruction {
    let defiIx = this.createDefiIx(
      SwimDefiInstruction.Add,
      addInstruction,
      {
        inputAmounts: this.toTokenValue(inputAmounts),
        minimumMintAmount: ToPool.tokenValue(
          minimumMintAmount,
          this.lpMintDecimals,
        ),
      },
      userTokenKeys,
      userDelegate,
    );
    defiIx.keys.push(toAccountMeta(userLpKey, true));
    return defiIx;
  }

  createRemoveUniformIx(
    exactBurnAmount: Decimal,
    minimumOutputAmounts: readonly Decimal[],
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
    userLpKey: PublicKey,
  ): TransactionInstruction {
    let defiIx = this.createDefiIx(
      SwimDefiInstruction.RemoveUniform,
      removeUniformInstruction,
      {
        exactBurnAmount: ToPool.tokenValue(
          exactBurnAmount,
          this.lpMintDecimals,
        ),
        minimumOutputAmounts: this.toTokenValue(minimumOutputAmounts),
      },
      userTokenKeys,
      userDelegate,
    );
    defiIx.keys.push(toAccountMeta(userLpKey, true));
    return defiIx;
  }

  createRemoveExactBurnIx(
    exactBurnAmount: Decimal,
    outputTokenIndex: number,
    minimumOutputAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
    userLpKey: PublicKey,
  ): TransactionInstruction {
    this.throwOnInvalidTokenIndex(outputTokenIndex);

    let defiIx = this.createDefiIx(
      SwimDefiInstruction.RemoveExactBurn,
      removeExactBurnInstruction,
      {
        exactBurnAmount: ToPool.tokenValue(
          exactBurnAmount,
          this.lpMintDecimals,
        ),
        outputTokenIndex,
        minimumOutputAmount: ToPool.tokenValue(
          minimumOutputAmount,
          this.tokenDecimals[outputTokenIndex],
        ),
      },
      userTokenKeys,
      userDelegate,
    );
    defiIx.keys.push(toAccountMeta(userLpKey, true));
    return defiIx;
  }

  createRemoveExactOutputIx(
    maximumBurnAmount: Decimal,
    exactOutputAmounts: readonly Decimal[],
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
    userLpKey: PublicKey,
  ): TransactionInstruction {
    let defiIx = this.createDefiIx(
      SwimDefiInstruction.RemoveExactOutput,
      removeExactOutputInstruction,
      {
        maximumBurnAmount: ToPool.tokenValue(
          maximumBurnAmount,
          this.lpMintDecimals,
        ),
        exactOutputAmounts: this.toTokenValue(exactOutputAmounts),
      },
      userTokenKeys,
      userDelegate,
    );
    defiIx.keys.push(toAccountMeta(userLpKey, true));
    return defiIx;
  }

  createSwapIx(
    exactInputAmounts: readonly Decimal[],
    outputTokenIndex: number,
    minimumOutputAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
  ): TransactionInstruction {
    this.throwOnInvalidTokenIndex(outputTokenIndex);

    return this.createDefiIx(
      SwimDefiInstruction.Swap,
      swapInstruction,
      {
        exactInputAmounts: this.toTokenValue(exactInputAmounts),
        outputTokenIndex,
        minimumOutputAmount: ToPool.tokenValue(
          minimumOutputAmount,
          this.tokenDecimals[outputTokenIndex],
        ),
      },
      userTokenKeys,
      userDelegate,
    );
  }

  createApproveLpIx(
    amount: Decimal,
    userLpKey: PublicKey,
    userDelegate: PublicKey,
    owner: PublicKey,
  ): TransactionInstruction {
    return createApproveInstruction(
      userLpKey,
      userDelegate,
      owner,
      BigInt(ToPool.tokenValue(amount, this.lpMintDecimals).toString()),
    );
  }

  createApproveTokenIxs(
    amounts: readonly Decimal[],
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
    owner: PublicKey,
  ): readonly TransactionInstruction[] {
    this.throwIfNotEqualTokenCount(amounts.length);
    this.throwIfNotEqualTokenCount(userTokenKeys.length);

    let approveIxs: TransactionInstruction[] = [];
    for (let i = 0; i < this.tokenCount; ++i) {
      if (amounts[i].isZero()) continue;

      if (userTokenKeys[i].equals(PublicKey.default))
        throw new Error(
          `non-zero amount for default token count at position ${i}`,
        );

      const amount = BigInt(
        ToPool.tokenValue(amounts[i], this.tokenDecimals[i]).toString(),
      );
      approveIxs.push(
        createApproveInstruction(userTokenKeys[i], userDelegate, owner, amount),
      );
    }
    return approveIxs;
  }

  createPrepareFeeChangeIx(
    lpFee: Decimal,
    governanceFee: Decimal,
  ): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.PrepareFeeChange,
      prepareFeeChangeInstruction,
      {
        lpFee: ToPool.fee(lpFee),
        governanceFee: ToPool.fee(governanceFee),
      },
    );
  }

  createEnactFeeChangeIx(): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.EnactFeeChange,
      enactFeeChangeInstruction,
    );
  }

  createPrepareGovernanceTransitionIx(
    upcomingGovernanceKey: PublicKey,
  ): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.PrepareGovernanceTransition,
      prepareGovernanceTransitionInstruction,
      { upcomingGovernanceKey },
    );
  }

  createEnactGovernanceTransitionIx(): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.EnactGovernanceTransition,
      enactGovernanceTransitionInstruction,
    );
  }

  createChangeGovernanceFeeAccountIx(
    governanceFeeKey: PublicKey,
  ): TransactionInstruction {
    let govIx = this.createGovernanceIx(
      SwimGovernanceInstruction.ChangeGovernanceFeeAccount,
      changeGovernanceFeeAccountInstruction,
      { governanceFeeKey },
    );
    govIx.keys.push(toAccountMeta(governanceFeeKey));
    return govIx;
  }

  createAdjustAmpFactorIx(
    targetTs: Timestamp,
    targetValue: Decimal,
  ): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.AdjustAmpFactor,
      adjustAmpFactorInstruction,
      {
        targetTs: ToPool.time(targetTs),
        targetValue: ToPool.decimal(targetValue),
      },
    );
  }

  createSetPauseIx(paused: boolean): TransactionInstruction {
    return this.createGovernanceIx(
      SwimGovernanceInstruction.SetPaused,
      setPausedInstruction,
      { paused },
    );
  }

  async add(
    inputAmounts: readonly Decimal[],
    minimumMintAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    userLpKey: PublicKey,
    payer: Signer,
  ): Promise<void> {
    const userDelegate = Keypair.generate();
    const approveIxs = this.createApproveTokenIxs(
      inputAmounts,
      userTokenKeys,
      userDelegate.publicKey,
      payer.publicKey,
    );
    const addIx = this.createAddIx(
      inputAmounts,
      minimumMintAmount,
      userTokenKeys,
      userDelegate.publicKey,
      userLpKey,
    );
    const tx = new Transaction();
    approveIxs.map((ix) => tx.add(ix));
    tx.add(addIx);
    await sendAndConfirmTransaction(this.connection, tx, [payer, userDelegate]);
  }

  async removeUniform(
    exactBurnAmount: Decimal,
    minimumOutputAmounts: readonly Decimal[],
    userTokenKeys: readonly PublicKey[],
    userLpKey: PublicKey,
    payer: Signer,
  ): Promise<void> {
    const userDelegate = Keypair.generate();
    const approveIx = this.createApproveLpIx(
      exactBurnAmount,
      userLpKey,
      userDelegate.publicKey,
      payer.publicKey,
    );
    const removeUniformIx = this.createRemoveUniformIx(
      exactBurnAmount,
      minimumOutputAmounts,
      userTokenKeys,
      userDelegate.publicKey,
      userLpKey,
    );
    const tx = new Transaction();
    tx.add(approveIx);
    tx.add(removeUniformIx);
    await sendAndConfirmTransaction(this.connection, tx, [payer, userDelegate]);
  }

  async removeExactBurn(
    exactBurnAmount: Decimal,
    outputTokenIndex: number,
    minimumOutputAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    userLpKey: PublicKey,
    payer: Signer,
  ): Promise<void> {
    const userDelegate = Keypair.generate();
    const approveIx = this.createApproveLpIx(
      exactBurnAmount,
      userLpKey,
      userDelegate.publicKey,
      payer.publicKey,
    );
    const removeExactBurnIx = this.createRemoveExactBurnIx(
      exactBurnAmount,
      outputTokenIndex,
      minimumOutputAmount,
      userTokenKeys,
      userDelegate.publicKey,
      userLpKey,
    );
    const tx = new Transaction();
    tx.add(approveIx);
    tx.add(removeExactBurnIx);
    await sendAndConfirmTransaction(this.connection, tx, [payer, userDelegate]);
  }

  async removeExactOutput(
    maximumBurnAmount: Decimal,
    exactOutputAmounts: readonly Decimal[],
    userTokenKeys: readonly PublicKey[],
    userLpKey: PublicKey,
    payer: Signer,
  ): Promise<void> {
    const userDelegate = Keypair.generate();
    const approveIx = this.createApproveLpIx(
      maximumBurnAmount,
      userLpKey,
      userDelegate.publicKey,
      payer.publicKey,
    );
    const removeExactBurnIx = this.createRemoveExactOutputIx(
      maximumBurnAmount,
      exactOutputAmounts,
      userTokenKeys,
      userDelegate.publicKey,
      userLpKey,
    );
    const tx = new Transaction();
    tx.add(approveIx);
    tx.add(removeExactBurnIx);
    await sendAndConfirmTransaction(this.connection, tx, [payer, userDelegate]);
  }

  async swap(
    exactInputAmounts: readonly Decimal[],
    outputTokenIndex: number,
    minimumOutputAmount: Decimal,
    userTokenKeys: readonly PublicKey[],
    payer: Signer,
  ): Promise<void> {
    const userDelegate = Keypair.generate();
    const approveIxs = this.createApproveTokenIxs(
      exactInputAmounts,
      userTokenKeys,
      userDelegate.publicKey,
      payer.publicKey,
    );
    const swapIx = this.createSwapIx(
      exactInputAmounts,
      outputTokenIndex,
      minimumOutputAmount,
      userTokenKeys,
      userDelegate.publicKey,
    );
    const tx = new Transaction();
    approveIxs.map((ix) => tx.add(ix));
    tx.add(swapIx);
    await sendAndConfirmTransaction(this.connection, tx, [payer, userDelegate]);
  }

  async prepareFeeChange(
    lpFee: Decimal,
    governanceFee: Decimal,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createPrepareFeeChangeIx(lpFee, governanceFee);
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async enactFeeChange(payer: Signer, governance: Signer): Promise<void> {
    const govIx = this.createEnactFeeChangeIx();
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async prepareGovernanceTransition(
    upcomingGovernanceKey: PublicKey,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createPrepareGovernanceTransitionIx(
      upcomingGovernanceKey,
    );
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async enactGovernanceTransition(
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createEnactGovernanceTransitionIx();
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async changeGovernanceFeeAccount(
    governanceFeeKey: PublicKey,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createPrepareGovernanceTransitionIx(governanceFeeKey);
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async adjustAmpFactor(
    targetTs: Timestamp,
    targetValue: Decimal,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createAdjustAmpFactorIx(targetTs, targetValue);
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async setPause(
    paused: boolean,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    const govIx = this.createSetPauseIx(paused);
    await this.sendGovernanceIx(govIx, payer, governance);
  }

  async sendGovernanceIx(
    govIx: TransactionInstruction,
    payer: Signer,
    governance: Signer,
  ): Promise<void> {
    await sendAndConfirmTransaction(
      this.connection,
      new Transaction().add(govIx),
      [payer, governance],
    );
  }

  private createDefiIx(
    defiInstruction: SwimDefiInstruction,
    layoutGenerator: Function,
    extraData: any,
    userTokenKeys: readonly PublicKey[],
    userDelegate: PublicKey,
  ): TransactionInstruction {
    this.throwIfNotEqualTokenCount(userTokenKeys.length);

    const dataObj = {
      instruction: SwimInstruction.DeFi,
      defiInstruction,
      ...extraData,
    };
    const keys = [
      toAccountMeta(this.stateKey, true),
      toAccountMeta(this.authority),
      ...this.tokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
      toAccountMeta(this.lpMintKey, true),
      toAccountMeta(this.governanceFeeKey, true),
      toAccountMeta(userDelegate, false, true),
      ...userTokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
      toAccountMeta(TOKEN_PROGRAM_ID),
    ];

    return this.createTxIx(layoutGenerator, dataObj, keys);
  }

  private createGovernanceIx(
    governanceInstruction: SwimGovernanceInstruction,
    layoutGenerator: Function,
    extraData: any = {},
  ): TransactionInstruction {
    const dataObj = {
      instruction: SwimInstruction.Governance,
      governanceInstruction,
      ...extraData,
    };
    const keys = [
      toAccountMeta(this.stateKey, true),
      toAccountMeta(this.governanceKey, false, true),
    ];

    return this.createTxIx(layoutGenerator, dataObj, keys);
  }

  private createTxIx(
    layoutGenerator: Function,
    dataObj: any,
    keys: AccountMeta[],
  ): TransactionInstruction {
    const layout = layoutGenerator(this.tokenCount);
    const data = Buffer.alloc(layout.span);
    layout.encode(dataObj, data);
    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    });
  }

  private toTokenValue(tokenValues: readonly Decimal[]): readonly BN[] {
    this.throwIfNotEqualTokenCount(tokenValues.length);
    return tokenValues.map((amount, index) =>
      ToPool.tokenValue(amount, this.tokenDecimals[index]),
    );
  }

  private throwOnInvalidTokenIndex(index: number): void {
    if (![...new Array(this.tokenCount).keys()].includes(index))
      throw new Error(
        `token index ${index} is invalid for ${this.tokenCount} tokens`,
      );
  }

  private throwIfNotEqualTokenCount(length: number): void {
    if (length != this.tokenCount)
      throw new Error(
        `array length mismatch, expected ${this.tokenCount} but got ${length}`,
      );
  }
}
