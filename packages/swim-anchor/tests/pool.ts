import * as anchor from "@project-serum/anchor";
import { Program, SplToken } from "@project-serum/anchor";
import { TwoPool } from "../target/types/two_pool";
import {web3, Spl} from "@project-serum/anchor";
import { assert, expect } from "chai";
import { Account, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";



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
  const governanceFeeValue = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps


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
        ampFactor, lpFee, governanceFeeValue,
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
      console.log(`marginalPrices: ${tx}`);
    } catch (e) {
      console.log(`error: ${JSON.stringify(e)}`);
    }
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


