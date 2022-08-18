import * as anchor from "@project-serum/anchor";
import { AnchorError, Program, SplToken } from "@project-serum/anchor";
// import { TwoPool } from "../target/types/two_pool";
import { TwoPool } from "../../src/artifacts/two_pool";
import { web3, Spl } from "@project-serum/anchor";
import { assert, expect } from "chai";
import {
  Account,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { getApproveAndRevokeIxs, twoPoolToString } from "../../src";
import {
  findMetadataPda,
  Metaplex,
  TokenMetadataProgram,
  toMetadata,
  toMetadataAccount,
} from "@metaplex-foundation/js";
import {
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "./poolTestUtils";
import { parsePoolAccount } from "../../src/poolDecoder";

describe("TwoPool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const payer = (provider.wallet as NodeWallet).payer;
  const metaplex = Metaplex.make(provider.connection);

  anchor.setProvider(provider);

  const twoPoolProgram = anchor.workspace.TwoPool as Program<TwoPool>;

  let flagshipPool: web3.PublicKey;

  const splToken = Spl.token(provider);
  const splAssociatedToken = Spl.associatedToken(provider);

  const mintDecimals = 6;

  const usdcKeypair = web3.Keypair.generate();
  const usdtKeypair = web3.Keypair.generate();
  const poolMintKeypairs = [usdcKeypair, usdtKeypair];
  const poolMintDecimals = [mintDecimals, mintDecimals];
  const poolMintAuthorities = [payer, payer];
  const swimUsdKeypair = web3.Keypair.generate();
  const governanceKeypair = web3.Keypair.generate();
  const pauseKeypair = web3.Keypair.generate();
  const newPauseKeypair = web3.Keypair.generate();
  const initialMintAmount = 1_000_000_000_000;

  let poolUsdcAtaAddr: web3.PublicKey;
  let poolUsdtAtaAddr: web3.PublicKey;
  let governanceFeeAddr: web3.PublicKey;

  let userUsdcAtaAddr: web3.PublicKey;
  let userUsdtAtaAddr: web3.PublicKey;
  let userSwimUsdAtaAddr: web3.PublicKey;

  const ampFactor = { value: new anchor.BN(300), decimals: 0 };
  const lpFee = { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
  const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

  before("setup", async () => {
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
    const params = {
      ampFactor,
      lpFee,
      governanceFee,
    };
    const tx = await twoPoolProgram.methods
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
    console.log(`pubkeys: ${JSON.stringify(pubkeys)}`);
    const pool = pubkeys.pool;
    console.log(
      `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
    );

    expect(pool.toBase58()).to.equal(flagshipPool.toBase58());
    const txSig = await tx.rpc({ skipPreflight: true });

    console.log("Your transaction signature", txSig);

    const poolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.log(`poolData: ${JSON.stringify(poolData, null, 2)}`);
    assert(poolData.ampFactor.targetValue.value.eq(ampFactor.value));
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

  describe("Defi Instructions", () => {
    it("Can add to pool", async () => {
      const previousDepthBefore = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;

      const inputAmounts = [
        new anchor.BN(100_000_000),
        new anchor.BN(100_000_000),
      ];
      const minimumMintAmount = new anchor.BN(0);
      const addParams = {
        inputAmounts,
        minimumMintAmount,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);

      const userLpTokenAccountBalance = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.log(
        `userLpTokenAccountBalance: ${userLpTokenAccountBalance.toString()}`,
      );
      assert(userLpTokenAccountBalance.gt(new anchor.BN(0)));
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(previousDepthAfter.gt(previousDepthBefore));
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
      const exactInputAmounts = [new anchor.BN(100_000), new anchor.BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new anchor.BN(0);
      const swapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;

      console.log(`
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
      assert(
        userUsdcTokenAcctBalanceAfter.eq(
          userUsdcTokenAcctBalanceBefore.sub(exactInputAmounts[0]),
        ),
      );
      assert(userUsdtTokenAcctBalanceAfter.gt(userUsdtTokenAcctBalanceBefore));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
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
      const maximumInputAmount = new anchor.BN(100_000);
      const maximumInputAmounts = [maximumInputAmount, new anchor.BN(0)];
      maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
      const exactOutputAmounts = [new anchor.BN(0), new anchor.BN(50_000)];
      const swapExactOutputParams = {
        maximumInputAmount,
        inputTokenIndex,
        exactOutputAmounts,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdcAtaAddr)
      ).amount;
      const userUsdtTokenAcctBalanceAfter = (
        await splToken.account.token.fetch(userUsdtAtaAddr)
      ).amount;
      const governanceFeeAcctBalanceAfter = (
        await splToken.account.token.fetch(governanceFeeAddr)
      ).amount;

      console.log(`
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
      assert(userUsdcTokenAcctBalanceAfter.lt(userUsdcTokenAcctBalanceBefore));
      assert(
        userUsdtTokenAcctBalanceAfter.eq(
          userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1]),
        ),
      );
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
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
      const exactBurnAmount = new anchor.BN(100_000);
      const minimumOutputAmounts = [
        new anchor.BN(10_000),
        new anchor.BN(10_000),
      ];
      const removeUniformParams = {
        exactBurnAmount,
        minimumOutputAmounts,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
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
      console.log(`
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
      assert(
        userUsdcTokenAcctBalanceAfter.gte(
          userUsdcTokenAcctBalanceBefore.add(minimumOutputAmounts[0]),
        ),
      );
      assert(
        userUsdtTokenAcctBalanceAfter.gte(
          userUsdtTokenAcctBalanceBefore.add(minimumOutputAmounts[1]),
        ),
      );
      assert(
        userSwimUsdTokenAcctBalanceAfter.eq(
          userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount),
        ),
      );
      assert(governanceFeeAcctBalanceAfter.eq(governanceFeeAcctBalanceBefore));
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
      const exactBurnAmount = new anchor.BN(100_000);
      const outputTokenIndex = 0;
      const minimumOutputAmount = new anchor.BN(10_000);
      const removeExactBurnParams = {
        exactBurnAmount,
        outputTokenIndex,
        minimumOutputAmount,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
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
      console.log(`
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
      assert(
        userUsdcTokenAcctBalanceAfter.gte(
          userUsdcTokenAcctBalanceBefore.add(minimumOutputAmount),
        ),
      );
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore));
      assert(
        userSwimUsdTokenAcctBalanceAfter.eq(
          userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount),
        ),
      );
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
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
      const maximumBurnAmount = new anchor.BN(3_000_000);

      //TODO: investigate this:
      //    if the output amounts were within 20_000 of each other then no goverance fee
      //    would be minted. is this due to approximation/values used?
      //    with decimals of 6 this is < 1 USDC. is the governance fee just too small in those cases?
      const exactOutputAmounts = [
        new anchor.BN(1_000_000),
        new anchor.BN(1_200_000),
      ];
      const removeExactOutputParams = {
        maximumBurnAmount,
        exactOutputAmounts,
      };
      let userTransferAuthority = web3.Keypair.generate();
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
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc();

      console.log("Your transaction signature", tx);
      const previousDepthAfter = (
        await twoPoolProgram.account.twoPool.fetch(flagshipPool)
      ).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
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
      console.log(`
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
      assert(
        userUsdcTokenAcctBalanceAfter.eq(
          userUsdcTokenAcctBalanceBefore.add(exactOutputAmounts[0]),
        ),
      );
      assert(
        userUsdtTokenAcctBalanceAfter.eq(
          userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1]),
        ),
      );
      assert(
        userSwimUsdTokenAcctBalanceAfter.gte(
          userSwimUsdTokenAcctBalanceBefore.sub(maximumBurnAmount),
        ),
      );
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
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
        const poolState = await twoPoolProgram.account.twoPool.fetch(
          flagshipPool,
        );
        console.log(`
        poolTokenAccount0Balance: ${poolTokenAccount0Balance.toString()}
        poolTokenAccount1Balance: ${poolTokenAccount1Balance.toString()}
        poolState.previousDepth: ${poolState.previousDepth.toString()}
        lpMintBalance: ${lpMintBalance.toString()}
        ampFactor: ${poolState.ampFactor.targetValue.value.toString()}
      `);
        const tx = await twoPoolProgram.methods
          .marginalPrices()
          .accounts({
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
          })
          .view();
        console.log(
          `marginalPrices: ${JSON.stringify(
            tx.map((x) => x.value.toString()),
          )}`,
        );
      } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
      }
    });
  });

  // prepare + enact tests (with time-transitions) are rust functional tests
  // since solana-program-test crate gives us access to do "timeskips"
  describe("Governance instructions tests (non-enact)", () => {
    it("Can adjust amp factor", async () => {
      const targetTs = new anchor.BN(Date.now() + 1000);
      const targetValue = { value: new anchor.BN(400), decimals: 0 };
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

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      assert(poolDataAfter.ampFactor.targetTs.eq(targetTs));
      assert(poolDataAfter.ampFactor.targetValue.value.eq(new anchor.BN(400)));
    });

    it("Can pause and unpause the pool", async () => {
      let poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      assert.isTrue(!poolData.isPaused);
      let paused = true;
      console.log(`sending pauseTxn`);
      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: pauseKeypair.publicKey,
        })
        .signers([pauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      assert.isTrue(poolData.isPaused);

      const exactInputAmounts = [new anchor.BN(1_000), new anchor.BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new anchor.BN(0);
      const swapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount,
      };
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer,
      );

      console.log(`trying defi ix on paused pool (should fail)`);
      try {
        const swapExactInputTx = await twoPoolProgram.methods
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
          .preInstructions(approveIxs)
          .postInstructions(revokeIxs)
          .signers([userTransferAuthority])
          .rpc();
        //Should not reach here
        assert(false);
      } catch (e) {
        console.log(`successfully threw error: ${JSON.stringify(e)}`);
      }

      console.log(`un-pausing pool`);
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
      assert.isTrue(!poolData.isPaused);

      console.log(`re-trying defi ix on un-paused pool`);
      try {
        const swapExactInputTx = await twoPoolProgram.methods
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
          .preInstructions(approveIxs)
          .postInstructions(revokeIxs)
          .signers([userTransferAuthority])
          .rpc();
        //Should not reach here
        console.log(
          `successfully submitted swapExactInputTx: ${swapExactInputTx}`,
        );
      } catch (e) {
        console.log(`should not have thrown error: ${JSON.stringify(e)}`);
        assert(false);
      }
    });

    it("Can update pool's pause key", async () => {
      const tx = await twoPoolProgram.methods
        .changePauseKey(newPauseKeypair.publicKey)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();

      let poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      assert(poolData.pauseKey.equals(newPauseKeypair.publicKey));
      let paused = true;

      try {
        console.log(`sending pauseTxn expected to fail`);
        await twoPoolProgram.methods
          .setPaused(paused)
          .accounts({
            pool: flagshipPool,
            pauseKey: pauseKeypair.publicKey,
          })
          .signers([pauseKeypair])
          .rpc();
      } catch (_err) {
        console.log(`successfully threw error: ${JSON.stringify(_err)}`);
        assert.isTrue(_err instanceof AnchorError);
        const err: AnchorError = _err;
        assert.strictEqual(err.error.errorMessage, "Invalid Pause Key");
      }

      await twoPoolProgram.methods
        .setPaused(paused)
        .accounts({
          pool: flagshipPool,
          pauseKey: newPauseKeypair.publicKey,
        })
        .signers([newPauseKeypair])
        .rpc();

      poolData = await twoPoolProgram.account.twoPool.fetch(flagshipPool);
      assert.isTrue(poolData.isPaused);

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
      assert.isTrue(!poolData.isPaused);
    });

    it("Can prepare fee changes", async () => {
      const newLpFee = { value: new anchor.BN(400), decimals: 6 }; //lp fee = .000400 = 0.0400% 3bps
      const newGovernanceFee = { value: new anchor.BN(200), decimals: 6 }; //gov fee = .000200 = (0.0200%) 1bps
      const params = {
        lpFee: newLpFee,
        governanceFee: newGovernanceFee,
      };
      const tx = await twoPoolProgram.methods
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

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      assert.equal(
        poolDataAfter.preparedLpFee.value,
        newLpFee.value.toNumber(),
      );
      assert.equal(
        poolDataAfter.preparedGovernanceFee.value,
        newGovernanceFee.value.toNumber(),
      );
    });

    it("Can prepare governance transitions", async () => {
      const upcomingGovernanceKey = web3.Keypair.generate().publicKey;
      const params = {
        upcomingGovernanceKey,
      };
      const tx = await twoPoolProgram.methods
        .prepareGovernanceTransition(upcomingGovernanceKey)
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
        })
        .signers([governanceKeypair])
        .rpc();

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      assert(poolDataAfter.preparedGovernanceKey.equals(upcomingGovernanceKey));
    });

    it("Can change governance fee account", async () => {
      const newGovernanceFeeOwner = web3.Keypair.generate().publicKey;
      const newGovernanceFeeKey = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          payer,
          swimUsdKeypair.publicKey,
          newGovernanceFeeOwner,
        )
      ).address;
      const tx = await twoPoolProgram.methods
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

      const poolDataAfter = await twoPoolProgram.account.twoPool.fetch(
        flagshipPool,
      );
      assert(poolDataAfter.governanceFeeKey.equals(newGovernanceFeeKey));
    });

    it("Throws error when changing governance fee account to invalid token account", async () => {
      try {
        const newGovernanceFeeKey = userUsdcAtaAddr;
        const tx = await twoPoolProgram.methods
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
        assert(false);
      } catch (_err) {
        // console.log(`_err: ${JSON.stringify(_err)}`);
        // console.log(`anchorErr: ${JSON.stringify(err)}`);
        //anchorErr: {
        // "errorLogs":[
        //    "Program log: AnchorError occurred. Error Code: ConstraintTokenMint. Error Number: 2014. Error Message: A token mint constraint was violated."
        //  ],
        // "logs":[
        //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM invoke [1]",
        //    "Program log: Instruction: ChangeGovernanceFeeAccount",
        //    "Program log: AnchorError occurred. Error Code: ConstraintTokenMint. Error Number: 2014. Error Message: A token mint constraint was violated.",
        //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM consumed 7871 of 200000 compute units",
        //    "Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM failed: custom program error: 0x7de"
        //  ],
        // "error":{
        //    "errorCode":{
        //      "code":"ConstraintTokenMint",
        //      "number":2014
        //    },
        //    "errorMessage":"A token mint constraint was violated"
        //    },
        //    "_programErrorStack":{
        //      "stack":["8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM"]
        //    }
        //  }
        assert.isTrue(_err instanceof AnchorError);
        const err: AnchorError = _err;
        assert.strictEqual(
          err.error.errorMessage,
          "A token mint constraint was violated",
        );
      }
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
      const params = {
        data,
        isMutable,
        updateAuthorityIsSigner,
      };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.log(`metadataPda: ${metadataPda.toBase58()}`);
      const tx = await twoPoolProgram.methods
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
      console.log(`metadata: ${JSON.stringify(metadata)}`);
      assert.equal(metadata.name, name);
      assert.equal(metadata.symbol, symbol);
      assert.equal(metadata.uri, uri);
      assert.equal(metadata.sellerFeeBasisPoints, sellerFeeBasisPoints);
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
      const params = {
        newUpdateAuthority,
        data,
        primarySaleHappened,
        isMutable,
      };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.log(`metadataPda: ${metadataPda.toBase58()}`);
      const tx = await twoPoolProgram.methods
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

      // console.log(`txSig: ${tx}`);
      // await provider.connection.confirmTransaction({
      //   signature: tx,
      //   ...(await provider.connection.getLatestBlockhash()),
      // });

      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(metadataPda),
      );

      const metadata = toMetadata(metadataAccount);
      console.log(`metadata: ${JSON.stringify(metadata)}`);
      assert.equal(metadata.name, name);
      assert.equal(metadata.symbol, symbol);
      assert.equal(metadata.uri, uri);
      assert.equal(metadata.sellerFeeBasisPoints, sellerFeeBasisPoints);
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
      const params = {
        newUpdateAuthority,
        data,
        primarySaleHappened,
        isMutable,
      };

      const metadataPda = findMetadataPda(swimUsdKeypair.publicKey);
      console.log(`metadataPda: ${metadataPda.toBase58()}`);
      try {
        const tx = await twoPoolProgram.methods
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
              updateAuthority: web3.Keypair.generate().publicKey,
            },
            mplTokenMetadata: TokenMetadataProgram.publicKey,
          })
          .signers([governanceKeypair])
          .rpc({ skipPreflight: true });

        assert(false);
      } catch (_err) {
        // no _err object. its a cpi failure
        // Transaction executed in slot 29:
        //   Signature: 4pcSvagKL81esLhvvhh8gbDsHQUGpiooNNjXuhtsUBZnQZN3Y5bs9nhJ3dbTXV5LDcLMZUQkx7jfr4LHKxCZfm6b
        //   Status: Error processing Instruction 0: Cross-program invocation with unauthorized signer or writable account
        //   Log Messages:
        //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM invoke [1]
        //     Program log: Instruction: UpdateLpMetadata
        //     8xaQHzj1v7R3XbQ2c3tjzpWoYRJgaYU4oFzCvq9Suf3c's signer privilege escalated
        //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM consumed 12361 of 200000 compute units
        //     Program 8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM failed: Cross-program invocation with unauthorized signer or writable account
        assert(true);
      }
    });
  });

  it("Can print pool state in friendly format", async () => {
    const poolState = await twoPoolToString(twoPoolProgram, flagshipPool);
    console.log(poolState);
  });

  it("Can fetch & deserialize pool state", async () => {
    const accountInfo = await provider.connection.getAccountInfo(flagshipPool);
    const poolAccountData = parsePoolAccount(accountInfo!.data);
    console.log(`poolAccountData: ${JSON.stringify(poolAccountData)}`);
  });
});
