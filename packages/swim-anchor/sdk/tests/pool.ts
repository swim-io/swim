import * as anchor from "@project-serum/anchor";
import { AnchorError, Program, SplToken } from "@project-serum/anchor";
// import { TwoPool } from "../target/types/two_pool";
import { TwoPool } from "../src/artifacts/two_pool";
import {web3, Spl} from "@project-serum/anchor";
import { assert, expect } from "chai";
import { Account, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { twoPoolToString } from "../src";



describe("TwoPool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const payer = (provider.wallet as NodeWallet).payer;

  anchor.setProvider(provider);

  const program = anchor.workspace.TwoPool as Program<TwoPool>;

  let flagshipPool: web3.PublicKey;

  const splToken = Spl.token(provider);
  const splAssociatedToken = Spl.associatedToken(provider);
  const mintDecimals = 6;
  const usdcKeypair = web3.Keypair.generate();
  const usdtKeypair = web3.Keypair.generate();
  const swimUsdKeypair = web3.Keypair.generate();
  const governanceKeypair = web3.Keypair.generate();

  let poolUsdcAtaAddr: web3.PublicKey;
  let poolUsdtAtaAddr: web3.PublicKey;
  let governanceFeeAddr: web3.PublicKey;
  let governanceFeeAccount: Account;

  let userUsdcAtaAddr: web3.PublicKey;
  let userUsdtAtaAddr: web3.PublicKey;
  let userSwimUsdAtaAddr: web3.PublicKey;

  const ampFactor  = { value: new anchor.BN(300), decimals: 0 };
  const lpFee =  { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
  const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps


  before("setup", async () => {
    await splToken
      .methods
      .initializeMint(mintDecimals, provider.publicKey, null)
      .accounts({
        mint: usdcKeypair.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(usdcKeypair),
      ])
      .signers([usdcKeypair])
      .rpc();

    await splToken
      .methods
      .initializeMint(mintDecimals, provider.publicKey, null)
      .accounts({
        mint: usdtKeypair.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(usdtKeypair),
      ])
      .signers([usdtKeypair])
      .rpc();

    [flagshipPool] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("two_pool"),
        usdcKeypair.publicKey.toBytes(),
        usdtKeypair.publicKey.toBytes(),
        swimUsdKeypair.publicKey.toBytes(),
      ],
      program.programId
    );

    poolUsdcAtaAddr = await getAssociatedTokenAddress(
      usdcKeypair.publicKey,
      flagshipPool,
      true
    );

    poolUsdtAtaAddr = await getAssociatedTokenAddress(
      usdtKeypair.publicKey,
      flagshipPool,
      true
    );


    console.log(`initialized pool token accounts`);

    governanceFeeAddr = await getAssociatedTokenAddress(
      swimUsdKeypair.publicKey,
      governanceKeypair.publicKey,
    );


    console.log(`initialized governance fee account`);

    console.log(`
      poolUsdcTokenAccount: ${poolUsdcAtaAddr.toBase58()}
      poolUsdtTokenAccount: ${poolUsdtAtaAddr.toBase58()}
      governanceFeeAddr: ${governanceFeeAddr.toBase58()}
    `);

  });
  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program
      .methods
      .initialize(
        ampFactor, lpFee, governanceFee,
      )
      .accounts({
        payer: provider.publicKey,
        poolMint0: usdcKeypair.publicKey,
        poolMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: governanceFeeAddr,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([swimUsdKeypair]);

    const pool = (await tx.pubkeys()).pool;
    console.log(`poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`);

    expect(pool.toBase58()).to.equal(flagshipPool.toBase58());
    const txSig = await tx.rpc({skipPreflight: true});

    console.log("Your transaction signature", txSig);

    const poolData = await program.account.twoPool.fetch(pool);
    console.log(`poolData: ${JSON.stringify(poolData, null, 2)}`);
    assert(poolData.ampFactor.targetValue.value.eq(ampFactor.value));
    await setupUserAssociatedTokenAccts();
  });

  describe("Defi Instructions", () => {
    it("Can add to pool", async () => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;

      const inputAmounts = [new anchor.BN(100_000_000), new anchor.BN(100_000_000)];
      const minimumMintAmount = new anchor.BN(0);
      const addParams = {
        inputAmounts,
        minimumMintAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userUsdcAtaAddr, userUsdtAtaAddr],
        inputAmounts,
        userTransferAuthority.publicKey,
        payer
      )
      const tx = await program
        .methods
        .add(
          addParams
        )
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

      const userLpTokenAccountBalance = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenAccountBalance: ${userLpTokenAccountBalance.toString()}`);
      assert(userLpTokenAccountBalance.gt(new anchor.BN(0)));
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(previousDepthAfter.gt(previousDepthBefore));

    });

    it("Can swap exact input to pool", async () => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const exactInputAmounts = [new anchor.BN(100_000), new anchor.BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new anchor.BN(0);
      const swapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer
      )

      const tx = await program
        .methods
        .swapExactInput(
          swapExactInputParams
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
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;

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
      assert(userUsdcTokenAcctBalanceAfter.eq(userUsdcTokenAcctBalanceBefore.sub(exactInputAmounts[0])));
      assert(userUsdtTokenAcctBalanceAfter.gt(userUsdtTokenAcctBalanceBefore));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
    });

    it("Can swap exact output to pool", async () => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;

      const inputTokenIndex = 0;
      const maximumInputAmount = new anchor.BN(100_000)
      const maximumInputAmounts = [
        maximumInputAmount,
        new anchor.BN(0)
      ];
      maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
      const exactOutputAmounts = [new anchor.BN(0), new anchor.BN(50_000)];
      const swapExactOutputParams = {
        maximumInputAmount,
        inputTokenIndex,
        exactOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userUsdcAtaAddr, userUsdtAtaAddr],
        maximumInputAmounts,
        userTransferAuthority.publicKey,
        payer
      )

      const tx = await program
        .methods
        .swapExactOutput(
          swapExactOutputParams
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
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;

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
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1])));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));

    });

    it("Can remove uniform", async() => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const exactBurnAmount = new anchor.BN(100_000)
      const minimumOutputAmounts = [new anchor.BN(10_000), new anchor.BN(10_000)];
      const removeUniformParams = {
        exactBurnAmount,
        minimumOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )

      const tx = await program
        .methods
        .removeUniform(
          removeUniformParams
        )
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
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
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
      assert(userUsdcTokenAcctBalanceAfter.gte(userUsdcTokenAcctBalanceBefore.add(minimumOutputAmounts[0])));
      assert(userUsdtTokenAcctBalanceAfter.gte(userUsdtTokenAcctBalanceBefore.add(minimumOutputAmounts[1])));
      assert(userSwimUsdTokenAcctBalanceAfter.eq(userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount)));
      assert(governanceFeeAcctBalanceAfter.eq(governanceFeeAcctBalanceBefore));
    });

    it("Can remove exact burn", async() => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const exactBurnAmount = new anchor.BN(100_000)
      const outputTokenIndex = 0;
      const minimumOutputAmount = new anchor.BN(10_000);
      const removeExactBurnParams = {
        exactBurnAmount,
        outputTokenIndex,
        minimumOutputAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )

      const tx = await program
        .methods
        .removeExactBurn(
          removeExactBurnParams
        )
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
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
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
      assert(userUsdcTokenAcctBalanceAfter.gte(userUsdcTokenAcctBalanceBefore.add(minimumOutputAmount)));
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore));
      assert(userSwimUsdTokenAcctBalanceAfter.eq(userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount)));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));

    });


    it("Can remove exact output", async() => {
      const previousDepthBefore = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const maximumBurnAmount = new anchor.BN(3_000_000)

      //TODO: investigate this:
      //    if the output amounts were within 20_000 of each other then no goverance fee
      //    would be minted. is this due to approximation/values used?
      //    with decimals of 6 this is < 1 USDC. is the governance fee just too small in those cases?
      const exactOutputAmounts = [new anchor.BN(1_000_000), new anchor.BN(1_200_000)];
      const removeExactOutputParams = {
        maximumBurnAmount,
        exactOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userSwimUsdAtaAddr],
        [maximumBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )

      const tx = await program
        .methods
        .removeExactOutput(
          removeExactOutputParams
        )
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
      const previousDepthAfter = (await program.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
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
      assert(userUsdcTokenAcctBalanceAfter.eq(userUsdcTokenAcctBalanceBefore.add(exactOutputAmounts[0])));
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1])));
      assert(userSwimUsdTokenAcctBalanceAfter.gte(userSwimUsdTokenAcctBalanceBefore.sub(maximumBurnAmount)));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
    });

    it("Can get marginal prices", async() => {
      try{
        const poolTokenAccount0Balance = (await splToken.account.token.fetch(poolUsdcAtaAddr)).amount;
        const poolTokenAccount1Balance = (await splToken.account.token.fetch(poolUsdtAtaAddr)).amount;
        const lpMintBalance = (await splToken.account.mint.fetch(swimUsdKeypair.publicKey)).supply;
        const poolState = await program.account.twoPool.fetch(flagshipPool);
        console.log(`
        poolTokenAccount0Balance: ${poolTokenAccount0Balance.toString()}
        poolTokenAccount1Balance: ${poolTokenAccount1Balance.toString()}
        poolState.previousDepth: ${poolState.previousDepth.toString()}
        lpMintBalance: ${lpMintBalance.toString()}
        ampFactor: ${poolState.ampFactor.targetValue.value.toString()}
      `)
        const tx = await program
          .methods
          .marginalPrices()
          .accounts({
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
          })
          .view();
        console.log(`marginalPrices: ${JSON.stringify(tx.map(x => x.value.toString()))}`);
      } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
      }
    });
  });

  // prepare + enact tests (with time-transitions) are rust functional tests
  // since solana-program-test crate gives us access to do "timeskips"
  describe("Governance instructions tests (non-enact)", () => {

    it("Can adjust amp factor", async() => {
      const targetTs = new anchor.BN(Date.now() + 1000);
      const targetValue = { value: new anchor.BN(400), decimals: 0 }
      const params = {
        targetTs,
        targetValue
      }
      const tx = await program
        .methods
        .adjustAmpFactor(
          params
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          }
        })
        .signers([governanceKeypair])
        .rpc();

      const poolDataAfter = await program.account.twoPool.fetch(flagshipPool);
      assert(poolDataAfter.ampFactor.targetTs.eq(targetTs));
      assert(poolDataAfter.ampFactor.targetValue.value.eq(new anchor.BN(400)))
    });

    it("Can pause and unpause the pool", async() => {
      let poolData = await program.account.twoPool.fetch(flagshipPool);
      assert.isTrue(!poolData.isPaused);
      let paused = true;
      console.log(`sending pauseTxn`);
      await program
        .methods
        .setPaused(
          { paused }
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          }
        })
        .signers([governanceKeypair])
        .rpc();

      poolData = await program.account.twoPool.fetch(flagshipPool);
      assert.isTrue(poolData.isPaused);

      const exactInputAmounts = [new anchor.BN(1_000), new anchor.BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new anchor.BN(0);
      const swapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer
      )

      console.log(`trying defi ix on paused pool (should fail)`);
      try{
        const swapExactInputTx = await program
          .methods
          .swapExactInput(
            swapExactInputParams
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
      await program
        .methods
        .setPaused(
          { paused }
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          }
        })
        .signers([governanceKeypair])
        .rpc();

      poolData = await program.account.twoPool.fetch(flagshipPool);
      assert.isTrue(!poolData.isPaused);

      console.log(`re-trying defi ix on un-paused pool`);
      try{
        const swapExactInputTx = await program
          .methods
          .swapExactInput(
            swapExactInputParams
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
        console.log(`successfully submitted swapExactInputTx: ${swapExactInputTx}`);
      } catch (e) {
        console.log(`should not have thrown error: ${JSON.stringify(e)}`);
        assert(false);
      }




    })

    it("Can prepare fee changes", async() => {
      const newLpFee =  { value: new anchor.BN(400), decimals: 6 }; //lp fee = .000400 = 0.0400% 3bps
      const newGovernanceFee = { value: new anchor.BN(200), decimals: 6 }; //gov fee = .000200 = (0.0200%) 1bps
      const params = {
        lpFee: newLpFee,
        governanceFee: newGovernanceFee
      }
      const tx = await program
        .methods
        .prepareFeeChange(
          params
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          }
        })
        .signers([governanceKeypair])
        .rpc();

      const poolDataAfter = await program.account.twoPool.fetch(flagshipPool);
      assert.equal(poolDataAfter.preparedLpFee.value, newLpFee.value.toNumber());
      assert.equal(poolDataAfter.preparedGovernanceFee.value, newGovernanceFee.value.toNumber());
    });

    it("Can prepare governance transitions", async() => {

      const upcomingGovernanceKey = web3.Keypair.generate().publicKey;
      const params = {
        upcomingGovernanceKey
      }
      const tx = await program
        .methods
        .prepareGovernanceTransition(
          params
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          }
        })
        .signers([governanceKeypair])
        .rpc();

      const poolDataAfter = await program.account.twoPool.fetch(flagshipPool);
      assert(poolDataAfter.preparedGovernanceKey.equals(upcomingGovernanceKey));
    });

    it("Can change governance fee account", async() => {
      const newGovernanceFeeOwner = web3.Keypair.generate().publicKey;
      const newGovernanceFeeKey = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        payer,
        swimUsdKeypair.publicKey,
        newGovernanceFeeOwner,
      )).address;
      const params = {
        newGovernanceFeeKey
      }
      const tx = await program
        .methods
        .changeGovernanceFeeAccount(
          params
        )
        .accounts({
          commonGovernance: {
            pool: flagshipPool,
            governance: governanceKeypair.publicKey,
          },
          newGovernanceFee: newGovernanceFeeKey
        })
        .signers([governanceKeypair])
        .rpc();

      const poolDataAfter = await program.account.twoPool.fetch(flagshipPool);
      assert(poolDataAfter.governanceFeeKey.equals(newGovernanceFeeKey));
    });

    it("Throws error when changing governance fee account to invalid token account", async() => {
      try{
        const newGovernanceFeeKey = userUsdcAtaAddr;
        const params = {
          newGovernanceFeeKey
        }
        const tx = await program
          .methods
          .changeGovernanceFeeAccount(
            params
          )
          .accounts({
            commonGovernance: {
              pool: flagshipPool,
              governance: governanceKeypair.publicKey,
            },
            newGovernanceFee: newGovernanceFeeKey
          })
          .signers([governanceKeypair])
          .rpc();
        assert(false);
      } catch (_err) {
        console.log(`_err: ${JSON.stringify(_err)}`);
        assert.isTrue(_err instanceof AnchorError);
        const err: AnchorError = _err;

        console.log(`anchorErr: ${JSON.stringify(err)}`);
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
        assert.strictEqual(err.error.errorMessage, "A token mint constraint was violated")
      }
    });
  })


  it("Can print pool state in friendly format", async() => {
    const poolState = await twoPoolToString(program, flagshipPool);
    console.log(poolState);
  });






  /** Helper functions */

  async function setupUserAssociatedTokenAccts() {
    userUsdcAtaAddr = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcKeypair.publicKey,
      provider.publicKey,
    )).address;

    userUsdtAtaAddr = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdtKeypair.publicKey,
      provider.publicKey,
    )).address;

    userSwimUsdAtaAddr = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      swimUsdKeypair.publicKey,
      provider.publicKey,
    )).address;

    await mintTo(
      provider.connection,
      payer,
      usdcKeypair.publicKey,
      userUsdcAtaAddr,
      payer,
      1_000_000_000_000_000
    );

    await mintTo(
      provider.connection,
      payer,
      usdtKeypair.publicKey,
      userUsdtAtaAddr,
      payer,
      1_000_000_000_000_000
    );
  }

  async function getApproveAndRevokeIxs(
    tokenAccounts: Array<web3.PublicKey>,
    amounts: Array<anchor.BN>,
    delegate: web3.PublicKey,
    authority: web3.Keypair
  ): Promise<Array<Array<web3.TransactionInstruction>>> {

    const approveIxs = await Promise.all(
      tokenAccounts.map((tokenAccount, i) => {
        return splToken
          .methods
          .approve(amounts[i])
          .accounts({
            source: tokenAccount,
            delegate,
            authority: authority.publicKey
          })
          .signers([authority])
          .instruction();
      })
    );
    const revokeIxs = await Promise.all(
      tokenAccounts.map((tokenAccount, i) => {
        return splToken
          .methods
          .revoke()
          .accounts({
            source: tokenAccount,
            authority: authority.publicKey
          })
          .signers([authority])
          .instruction();
      }));
    return [approveIxs, revokeIxs];
  }
});


