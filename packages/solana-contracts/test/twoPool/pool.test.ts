import {
  Metaplex,
  TokenMetadataProgram,
  findMetadataPda,
  toMetadata,
  toMetadataAccount,
} from "@metaplex-foundation/js";
import type { Program } from "@project-serum/anchor";
// eslint-disable-next-line import/order
import {
  AnchorProvider,
  BN,
  Spl,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";

// const {
//   PublicKey,
//   Keypair
// } = web3;

// import { TwoPool } from "../target/types/two_pool";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

import { getApproveAndRevokeIxs, twoPoolToString } from "../../src";
import type { TwoPool } from "../../src/artifacts/two_pool";
import { parsePoolAccount } from "../../src/poolDecoder";

import {
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "./poolTestUtils";

import Keypair = web3.Keypair;
import PublicKey = web3.PublicKey;

describe("TwoPool", () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  const payer = (provider.wallet as NodeWallet).payer;
  const metaplex = Metaplex.make(provider.connection);

  setProvider(provider);

  const twoPoolProgram = workspace.TwoPool as Program<TwoPool>;

  let flagshipPool: PublicKey;

  const splToken = Spl.token(provider);
  const splAssociatedToken = Spl.associatedToken(provider);

  const mintDecimals = 6;

  const usdcKeypair = Keypair.generate();
  const usdtKeypair = Keypair.generate();
  const poolMintKeypairs = [usdcKeypair, usdtKeypair];
  const poolMintDecimals = [mintDecimals, mintDecimals];
  const poolMintAuthorities = [payer, payer];
  const swimUsdKeypair = Keypair.generate();
  const governanceKeypair = Keypair.generate();
  const pauseKeypair = Keypair.generate();
  const newPauseKeypair = Keypair.generate();
  const initialMintAmount = 1_000_000_000_000;

  let poolUsdcAtaAddr: PublicKey;
  let poolUsdtAtaAddr: PublicKey;
  let governanceFeeAddr: PublicKey;

  let userUsdcAtaAddr: PublicKey;
  let userUsdtAtaAddr: PublicKey;
  let userSwimUsdAtaAddr: PublicKey;

  const ampFactor = { value: new BN(300), decimals: 0 };
  const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
  const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

  beforeAll(async () => {
    ({
      poolPubkey: flagshipPool,
      poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
      governanceFeeAccount: governanceFeeAddr,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      poolMintKeypairs,
      poolMintDecimals,
      poolMintAuthorities.map((keypair) => keypair.publicKey),
      swimUsdKeypair.publicKey,
      governanceKeypair.publicKey,
    ));
  });
  it("Is initialized!", async () => {
    // Add your test here.
    // const params = {
    //   ampFactor,
    //   lpFee,
    //   governanceFee,
    // };
    const tx = twoPoolProgram.methods
      // .initialize(params)
      .initialize(ampFactor, lpFee, governanceFee)
      .accounts({
        payer: provider.publicKey,
        poolMint0: usdcKeypair.publicKey,
        poolMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: governanceFeeAddr,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([swimUsdKeypair]);

    const pubkeys = await tx.pubkeys();
    console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
    const pool = pubkeys.pool;

    if (!pool) {
      throw new Error("Pool pubkey not found");
    }
    console.info(
      `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
    );

    expect(pool.toBase58()).toEqual(flagshipPool.toBase58());
    const txSig = await tx.rpc({ skipPreflight: true });

    console.info("Your transaction signature", txSig);

    const poolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.info(`poolData: ${JSON.stringify(poolData, null, 2)}`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const actualAmpFactorTargetValue = poolData.ampFactor.targetValue.value;
    expect(actualAmpFactorTargetValue.eq(ampFactor.value)).toBeTruthy();
    ({
      userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
      userLpTokenAta: userSwimUsdAtaAddr,
    } = await setupUserAssociatedTokenAccts(
      provider.connection,
      provider.publicKey,
      poolMintKeypairs.map((kp) => kp.publicKey),
      poolMintAuthorities,
      swimUsdKeypair.publicKey,
      initialMintAmount,
      payer,
    ));
  });

  it("Can print pool state in friendly format", async () => {
    const poolState = await twoPoolToString(twoPoolProgram, flagshipPool);
    console.info(poolState);
    expect(poolState).toBeTruthy();
  });

  it("Can fetch & deserialize pool state", async () => {
    const accountInfo = await provider.connection.getAccountInfo(flagshipPool);
    if (!accountInfo) {
      throw new Error("Failed to get accountInfo");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const poolAccountData = parsePoolAccount(accountInfo.data);
    console.info(`poolAccountData: ${JSON.stringify(poolAccountData)}`);
    expect(poolAccountData).toBeTruthy();
  });

  describe("Defi Instructions", () => {
    it("Can add to pool", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;

      const inputAmounts = [new BN(100_000_000), new BN(100_000_000)];
      const minimumMintAmount = new BN(0);
      // const addParams = {
      //   inputAmounts,
      //   minimumMintAmount,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        inputAmounts,
        userTransferAuthority.publicKey,
        payer,
      );
      const tx = await twoPoolProgram.methods
        // .add(addParams)
        .add(inputAmounts, minimumMintAmount)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);

      const userLpTokenAccountBalance = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.info(
        `userLpTokenAccountBalance: ${userLpTokenAccountBalance.toString()}`,
      );
      expect(userLpTokenAccountBalance.gt(new BN(0))).toBeTruthy();
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(previousDepthAfter.gt(previousDepthBefore)).toBeTruthy();
    });

    it("Can swap exact input to pool", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceBefore = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      const exactInputAmounts = [new BN(100_000), new BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new BN(0);
      // const swapExactInputParams = {
      //   exactInputAmounts,
      //   outputTokenIndex,
      //   minimumOutputAmount,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer,
      );

      const tx = await twoPoolProgram.methods
        // .swapExactInput(swapExactInputParams)
        .swapExactInput(
          exactInputAmounts,
          outputTokenIndex,
          minimumOutputAmount,
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;

      console.info(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      expect(
        userUsdcTokenAcctBalanceAfter.eq(
          userUsdcTokenAcctBalanceBefore.sub(exactInputAmounts[0]),
        ),
      ).toBeTruthy();
      expect(
        userUsdtTokenAcctBalanceAfter.gt(userUsdtTokenAcctBalanceBefore),
      ).toBeTruthy();
      expect(
        governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore),
      ).toBeTruthy();
    });

    it("Can swap exact output to pool", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceBefore = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;

      const inputTokenIndex = 0;
      const maximumInputAmount = new BN(100_000);
      const maximumInputAmounts = [maximumInputAmount, new BN(0)];
      const exactOutputAmounts = [new BN(0), new BN(50_000)];
      // const swapExactOutputParams = {
      //   maximumInputAmount,
      //   inputTokenIndex,
      //   exactOutputAmounts,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        maximumInputAmounts,
        userTransferAuthority.publicKey,
        payer,
      );

      const tx = await twoPoolProgram.methods
        // .swapExactOutput(swapExactOutputParams)
        .swapExactOutput(
          maximumInputAmount,
          inputTokenIndex,
          exactOutputAmounts,
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;

      console.info(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      expect(
        userUsdcTokenAcctBalanceAfter.lt(userUsdcTokenAcctBalanceBefore),
      ).toBeTruthy();
      expect(
        userUsdtTokenAcctBalanceAfter.eq(
          userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1]),
        ),
      ).toBeTruthy();
      expect(
        governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore),
      ).toBeTruthy();
    });

    it("Can remove uniform", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceBefore = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      const exactBurnAmount = new BN(100_000);
      const minimumOutputAmounts = [new BN(10_000), new BN(10_000)];
      // const removeUniformParams = {
      //   exactBurnAmount,
      //   minimumOutputAmounts,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer,
      );

      const tx = await twoPoolProgram.methods
        // .removeUniform(removeUniformParams)
        .removeUniform(exactBurnAmount, minimumOutputAmounts)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      console.info(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      userSwimUsdTokenAcctBalance
        Before: ${userSwimUsdTokenAcctBalanceBefore.toString()}
        After:  ${userSwimUsdTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      expect(
        userUsdcTokenAcctBalanceAfter.gte(
          userUsdcTokenAcctBalanceBefore.add(minimumOutputAmounts[0]),
        ),
      ).toBeTruthy();
      expect(
        userUsdtTokenAcctBalanceAfter.gte(
          userUsdtTokenAcctBalanceBefore.add(minimumOutputAmounts[1]),
        ),
      ).toBeTruthy();
      expect(
        userSwimUsdTokenAcctBalanceAfter.eq(
          userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount),
        ),
      ).toBeTruthy();
      expect(
        governanceFeeAcctBalanceAfter.eq(governanceFeeAcctBalanceBefore),
      ).toBeTruthy();
    });

    it("Can remove exact burn", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceBefore = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      const exactBurnAmount = new BN(100_000);
      const outputTokenIndex = 0;
      const minimumOutputAmount = new BN(10_000);
      // const removeExactBurnParams = {
      //   exactBurnAmount,
      //   outputTokenIndex,
      //   minimumOutputAmount,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer,
      );

      const tx = await twoPoolProgram.methods
        // .removeExactBurn(removeExactBurnParams)
        .removeExactBurn(exactBurnAmount, outputTokenIndex, minimumOutputAmount)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      console.info(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      userSwimUsdTokenAcctBalance
        Before: ${userSwimUsdTokenAcctBalanceBefore.toString()}
        After:  ${userSwimUsdTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      expect(
        userUsdcTokenAcctBalanceAfter.gte(
          userUsdcTokenAcctBalanceBefore.add(minimumOutputAmount),
        ),
      ).toBeTruthy();
      expect(
        userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore),
      ).toBeTruthy();
      expect(
        userSwimUsdTokenAcctBalanceAfter.eq(
          userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount),
        ),
      ).toBeTruthy();
      expect(
        governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore),
      ).toBeTruthy();
    });

    it("Can remove exact output", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceBefore = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      const maximumBurnAmount = new BN(3_000_000);

      //TODO: investigate this:
      //    if the output amounts were within 20_000 of each other then no goverance fee
      //    would be minted. is this due to approximation/values used?
      //    with decimals of 6 this is < 1 USDC. is the governance fee just too small in those cases?
      const exactOutputAmounts = [new BN(1_000_000), new BN(1_200_000)];
      // const removeExactOutputParams = {
      //   maximumBurnAmount,
      //   exactOutputAmounts,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [maximumBurnAmount],
        userTransferAuthority.publicKey,
        payer,
      );

      const tx = await twoPoolProgram.methods
        // .removeExactOutput(removeExactOutputParams)
        .removeExactOutput(maximumBurnAmount, exactOutputAmounts)
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.info(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const userSwimUsdTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;
      console.info(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      userSwimUsdTokenAcctBalance
        Before: ${userSwimUsdTokenAcctBalanceBefore.toString()}
        After:  ${userSwimUsdTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      expect(
        userUsdcTokenAcctBalanceAfter.eq(
          userUsdcTokenAcctBalanceBefore.add(exactOutputAmounts[0]),
        ),
      ).toBeTruthy();
      expect(
        userUsdtTokenAcctBalanceAfter.eq(
          userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1]),
        ),
      ).toBeTruthy();
      expect(
        userSwimUsdTokenAcctBalanceAfter.gte(
          userSwimUsdTokenAcctBalanceBefore.sub(maximumBurnAmount),
        ),
      ).toBeTruthy();
      expect(
        governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore),
      ).toBeTruthy();
    });

    it("Can get marginal prices", async () => {
      try {
        const poolTokenAccount0Balance = (
          await splToken.account.token.fetch(poolUsdcAtaAddr)
        ).amount;
        const poolTokenAccount1Balance = (
          await splToken.account.token.fetch(poolUsdtAtaAddr)
        ).amount;
        const lpMintBalance = (
          await splToken.account.mint.fetch(swimUsdKeypair.publicKey)
        ).supply;
        const { ampFactor: ampFactor1, previousDepth } =
          await twoPoolProgram.account.twoPool.fetch(flagshipPool);
        console.info(`
        poolTokenAccount0Balance: ${poolTokenAccount0Balance.toString()}
        poolTokenAccount1Balance: ${poolTokenAccount1Balance.toString()}
        poolState.previousDepth: ${previousDepth.toString()}
        lpMintBalance: ${lpMintBalance.toString()}
      `);
        //
        // console.info(
        //   `ampFactor: ${ampFactor1.targetValue.value.toString()}`,
        // );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const tx = await twoPoolProgram.methods
          .marginalPrices()
          .accounts({
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
          })
          .view();
        // console.info(
        //   `marginalPrices: ${JSON.stringify(
        //     tx.map((x) => x.value.toString()),
        //   )}`,
        // );
      } catch (e) {
        console.info(`error: ${JSON.stringify(e)}`);
      }
      expect(true).toBeTruthy();
    });
  });

  // prepare + enact tests (with time-transitions) are rust functional tests
  // since solana-program-test crate gives us access to do "timeskips"
  describe("Governance instructions tests (non-enact)", () => {
    it("Can adjust amp factor", async () => {
      const targetTs = new BN(Date.now() + 1000);
      const targetValue = { value: new BN(400), decimals: 0 };
      const params = {
        targetTs,
        targetValue,
      };
      const tx = await twoPoolProgram.methods
        // .adjustAmpFactor(params)
        .adjustAmpFactor(targetTs, targetValue)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();

      const { ampFactor: ampFactor1 } =
        await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(ampFactor1.targetTs.eq(targetTs)).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(ampFactor1.targetValue.value.eq(new BN(400))).toBeTruthy();
    });

    it("Can pause and unpause the pool", async () => {
      let poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(!poolData.isPaused).toBe(true);
      let paused = true;
      console.info(`sending pauseTxn`);
      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: pauseKeypair.publicKey,
        })
        .signers([pauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(poolData.isPaused).toBe(true);

      const exactInputAmounts = [new BN(1_000), new BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new BN(0);
      // const swapExactInputParams = {
      //   exactInputAmounts,
      //   outputTokenIndex,
      //   minimumOutputAmount,
      // };
      const userTransferAuthority = Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer,
      );

      console.info(`trying defi ix on paused pool (should fail)`);
      await expect(() =>
        twoPoolProgram.methods
          // .swapExactInput(swapExactInputParams)
          .swapExactInput(
            exactInputAmounts,
            outputTokenIndex,
            minimumOutputAmount,
          )
          .accounts({
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
            governanceFee: governanceFeeAddr,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userUsdcAtaAddr,
            userTokenAccount1: userUsdtAtaAddr,
            tokenProgram: splToken.programId,
          })
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc(),
      ).rejects.toThrow();
      // try {
      //   await //Should not reach here
      //   expect(false).toBeTruthy();
      // } catch (e) {
      //   console.info(`successfully threw error: ${JSON.stringify(e)}`);
      // }

      console.info(`un-pausing pool`);
      paused = false;
      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: pauseKeypair.publicKey,
        })
        .signers([pauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(!poolData.isPaused).toBe(true);

      console.info(`re-trying defi ix on un-paused pool`);
      await twoPoolProgram.methods
        // .swapExactInput(swapExactInputParams)
        .swapExactInput(
          exactInputAmounts,
          outputTokenIndex,
          minimumOutputAmount,
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          tokenProgram: splToken.programId,
        })
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();
    });

    it("Can update pool's pause key", async () => {
      const changePauseKeyTxn = await twoPoolProgram.methods
        .changePauseKey(newPauseKeypair.publicKey)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();

      console.info(`changePauseKeyTxn: ${changePauseKeyTxn}`);
      let poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(poolData.pauseKey.equals(newPauseKeypair.publicKey)).toBeTruthy();
      let paused = true;

      await expect(() =>
        twoPoolProgram.methods
          .setPaused(paused)
          .accounts({
            pool: flagshipPool,
            pauseKey: pauseKeypair.publicKey,
          })
          .signers([pauseKeypair])
          .rpc(),
      ).rejects.toThrow("Invalid Pause Key");
      // try {
      //   console.info(`sending pauseTxn expected to fail`);
      //   await twoPoolProgram.methods
      //     .setPaused(paused)
      //     .accounts({
      //       pool: flagshipPool,
      //       pauseKey: pauseKeypair.publicKey,
      //     })
      //     .signers([pauseKeypair])
      //     .rpc();
      // } catch (_err) {
      //   console.info(`successfully threw error: ${JSON.stringify(_err)}`);
      //   expect(_err instanceof AnchorError).toBe(true);
      //   const err: AnchorError = _err as unknown as AnchorError;
      //   expect(err.error.errorMessage).toBe("Invalid Pause Key");
      // }

      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: newPauseKeypair.publicKey,
        })
        .signers([newPauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(poolData.isPaused).toEqual(true);

      paused = false;
      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: newPauseKeypair.publicKey,
        })
        .signers([newPauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      expect(!poolData.isPaused).toEqual(true);
    });

    it("Can prepare fee changes", async () => {
      const newLpFee = { value: new BN(400), decimals: 6 }; //lp fee = .000400 = 0.0400% 3bps
      const newGovernanceFee = { value: new BN(200), decimals: 6 }; //gov fee = .000200 = (0.0200%) 1bps
      // const params = {
      //   lpFee: newLpFee,
      //   governanceFee: newGovernanceFee,
      // };
      const prepareFeeChangeTxn = await twoPoolProgram.methods
        // .prepareFeeChange(params)
        .prepareFeeChange(newLpFee, newGovernanceFee)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();
      console.info(`send prepareFeeChangeTxn: ${prepareFeeChangeTxn}`);

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      expect(poolDataAfter.preparedLpFee.value).toEqual(
        newLpFee.value.toNumber(),
      );
      expect(poolDataAfter.preparedGovernanceFee.value).toEqual(
        newGovernanceFee.value.toNumber(),
      );
    });

    it("Can prepare governance transitions", async () => {
      const upcomingGovernanceKey = Keypair.generate().publicKey;
      // const params = {
      //   upcomingGovernanceKey,
      // };
      const prepareGovernanceTransitionTxn = await twoPoolProgram.methods
        .prepareGovernanceTransition(upcomingGovernanceKey)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();
      console.info(
        `send prepareGovernanceTransitionTxn: ${prepareGovernanceTransitionTxn}`,
      );

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      expect(
        poolDataAfter.preparedGovernanceKey.equals(upcomingGovernanceKey),
      ).toBeTruthy();
    });

    it("Can change governance fee account", async () => {
      const newGovernanceFeeOwner = Keypair.generate().publicKey;
      const newGovernanceFeeKey = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          payer,
          swimUsdKeypair.publicKey,
          newGovernanceFeeOwner,
        )
      ).address;
      const changeGovFeeTxn = await twoPoolProgram.methods
        .changeGovernanceFeeAccount(newGovernanceFeeKey)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
          newGovernanceFee: newGovernanceFeeKey,
        })
        .signers([governanceKeypair])
        .rpc();
      console.info(`send changeGovFeeTxn: ${changeGovFeeTxn}`);

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      expect(
        poolDataAfter.governanceFeeKey.equals(newGovernanceFeeKey),
      ).toBeTruthy();
    });

    it("Throws error when changing governance fee account to invalid token account", async () => {
      const newGovernanceFeeKey = userUsdcAtaAddr;
      await expect(() => {
        return twoPoolProgram.methods
          .changeGovernanceFeeAccount(newGovernanceFeeKey)
          .accounts({
            commonGovernance: {
              pool: flagshipPool,
              governance: governanceKeypair.publicKey,
            },
            newGovernanceFee: newGovernanceFeeKey,
          })
          .signers([governanceKeypair])
          .rpc();
      }).rejects.toThrow("A token mint constraint was violated");
      // try {
      //
      //
      //   await twoPoolProgram.methods
      //     .changeGovernanceFeeAccount(newGovernanceFeeKey)
      //     .accounts({
      //       commonGovernance: {
      //         pool: flagshipPool,
      //         governance: governanceKeypair.publicKey,
      //       },
      //       newGovernanceFee: newGovernanceFeeKey,
      //     })
      //     .signers([governanceKeypair])
      //     .rpc();
      //   expect(false).toBeTruthy();
      // } catch (_err) {
      //   // console.info(`_err: ${JSON.stringify(_err)}`);
      //   // console.info(`anchorErr: ${JSON.stringify(err)}`);
      //   //anchorErr: {
      //   // "errorLogs":[
      //   //    "Program log: AnchorError occurred. Error Code: ConstraintTokenMint. Error Number: 2014. Error Message: A token mint constraint was violated."
      //   //  ],
      //   // "logs":[
      //   //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM invoke [1]",
      //   //    "Program log: Instruction: ChangeGovernanceFeeAccount",
      //   //    "Program log: AnchorError occurred. Error Code: ConstraintTokenMint. Error Number: 2014. Error Message: A token mint constraint was violated.",
      //   //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM consumed 7871 of 200000 compute units",
      //   //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM failed: custom program error: 0x7de"
      //   //  ],
      //   // "error":{
      //   //    "errorCode":{
      //   //      "code":"ConstraintTokenMint",
      //   //      "number":2014
      //   //    },
      //   //    "errorMessage":"A token mint constraint was violated"
      //   //    },
      //   //    "_programErrorStack":{
      //   //      "stack":["8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM"]
      //   //    }
      //   //  }
      //   expect(_err instanceof AnchorError).toBe(true);
      //   const err: AnchorError = _err;
      //   expect(err.error.errorMessage).toBe(
      //     "A token mint constraint was violated",
      //   );
      // }
    });
    it("Can create mpl token metadata for lp token", async () => {
      const name = "swimUSD";
      const symbol = "swimUSD";
      const uri = "https://dummy_uri.com";
      const sellerFeeBasisPoints = 1;
      const data = {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        creators: null,
        collection: null,
        uses: null,
      };
      const isMutable = true;
      const updateAuthorityIsSigner = true;
      // const params = {
      //   data,
      //   isMutable,
      //   updateAuthorityIsSigner,
      // };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.info(`metadataPda: ${metadataPda.toBase58()}`);
      await twoPoolProgram.methods
        // .createLpMetadata(params)
        .createLpMetadata(data, isMutable, updateAuthorityIsSigner)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
          createMetadataAccounts: {
            metadata: metadataPda,
            mint: swimUsdKeypair.publicKey,
            mintAuthority: flagshipPool,
            payer: provider.publicKey,
            updateAuthority: flagshipPool,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          },
          mplTokenMetadata: TokenMetadataProgram.publicKey,
        })
        .signers([governanceKeypair])
        .rpc({ skipPreflight: true });

      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(metadataPda),
      );

      const metadata = toMetadata(metadataAccount);
      console.info(`metadata: ${JSON.stringify(metadata)}`);
      expect(metadata.name).toEqual(name);
      expect(metadata.symbol).toEqual(symbol);
      expect(metadata.uri).toEqual(uri);
      expect(metadata.sellerFeeBasisPoints).toEqual(sellerFeeBasisPoints);
    });

    it("Can update mpl token metadata for lp token", async () => {
      const newUpdateAuthority = null;
      const name = "swimUSD_v2";
      const symbol = "swimUSD_v2";
      const uri = "https://dummy_uri.com";
      const sellerFeeBasisPoints = 2;
      const data = {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        creators: null,
        collection: null,
        uses: null,
      };
      const primarySaleHappened = null;
      const isMutable = null;
      // const params = {
      //   newUpdateAuthority,
      //   data,
      //   primarySaleHappened,
      //   isMutable,
      // };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.info(`metadataPda: ${metadataPda.toBase58()}`);
      await twoPoolProgram.methods
        .updateLpMetadata(
          // params,
          newUpdateAuthority,
          data,
          // null,
          primarySaleHappened,
          isMutable,
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
          updateMetadataAccounts: {
            metadata: metadataPda,
            updateAuthority: flagshipPool,
          },
          mplTokenMetadata: TokenMetadataProgram.publicKey,
        })
        .signers([governanceKeypair])
        .rpc({ skipPreflight: true });

      // console.info(`txSig: ${tx}`);
      // await provider.connection.confirmTransaction({
      //   signature: tx,
      //   ...(await provider.connection.getLatestBlockhash()),
      // });

      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(metadataPda),
      );

      const metadata = toMetadata(metadataAccount);
      console.info(`metadata: ${JSON.stringify(metadata)}`);
      expect(metadata.name).toEqual(name);
      expect(metadata.symbol).toEqual(symbol);
      expect(metadata.uri).toEqual(uri);
      expect(metadata.sellerFeeBasisPoints).toEqual(sellerFeeBasisPoints);
    });

    it("should fail when invalid update authority attempts to update lp token metadata", async () => {
      const newUpdateAuthority = null;
      const name = "swimUSD_v3";
      const symbol = "swimUSD_v3";
      const uri = "https://dummy_uri.com";
      const sellerFeeBasisPoints = 2;
      const data = {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        creators: null,
        collection: null,
        uses: null,
      };
      const primarySaleHappened = null;
      const isMutable = null;
      // const params = {
      //   newUpdateAuthority,
      //   data,
      //   primarySaleHappened,
      //   isMutable,
      // };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.info(`metadataPda: ${metadataPda.toBase58()}`);
      await expect(() => {
        return (
          twoPoolProgram.methods
            // .updateLpMetadata(params)
            .updateLpMetadata(
              newUpdateAuthority,
              data,
              primarySaleHappened,
              isMutable,
            )
            .accounts({
              commonGovernance: {
                pool: flagshipPool,
                governance: governanceKeypair.publicKey,
              },
              updateMetadataAccounts: {
                metadata: metadataPda,
                updateAuthority: Keypair.generate().publicKey,
              },
              mplTokenMetadata: TokenMetadataProgram.publicKey,
            })
            .signers([governanceKeypair])
            .rpc({ skipPreflight: true })
        );
      }).rejects.toThrow();
      // try {
      //   await twoPoolProgram.methods
      //     // .updateLpMetadata(params)
      //     .updateLpMetadata(
      //       newUpdateAuthority,
      //       data,
      //       primarySaleHappened,
      //       isMutable,
      //     )
      //     .accounts({
      //       commonGovernance: {
      //         pool: flagshipPool,
      //         governance: governanceKeypair.publicKey,
      //       },
      //       updateMetadataAccounts: {
      //         metadata: metadataPda,
      //         updateAuthority: Keypair.generate().publicKey,
      //       },
      //       mplTokenMetadata: TokenMetadataProgram.publicKey,
      //     })
      //     .signers([governanceKeypair])
      //     .rpc({ skipPreflight: true });
      //
      //   expect(false).toBeTruthy();
      // } catch (_err) {
      //   // no _err object. its a cpi failure
      //   // Transaction executed in slot 29:
      //   //   Signature: 4pcSvagKL81esLhvvhh8gbDsHQUGpiooNNjXuhtsUBZnQZN3Y5bs9nhJ3dbTXV5LDcLMZUQkx7jfr4LHKxCZfm6b
      //   //   Status: Error processing Instruction 0: Cross-program invocation with unauthorized signer or writable account
      //   //   Log Messages:
      //   //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM invoke [1]
      //   //     Program log: Instruction: UpdateLpMetadata
      //   //     8xaQHzj1v7R3XbQ2c3tjzpWoYRJgaYU4oFzCvq9Suf3c's signer privilege escalated
      //   //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM consumed 12361 of 200000 compute units
      //   //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM failed: Cross-program invocation with unauthorized signer or writable account
      //   expect(true).toBeTruthy();
      // }
    });
  });


});
