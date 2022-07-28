import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
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
  const coder = program.coder;

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


    // userUsdcAtaAddr = await getAssociatedTokenAddress(
    //   usdcKeypair.publicKey,
    //   provider.publicKey,
    // );
    //
    // userUsdtAtaAddr = await getAssociatedTokenAddress(
    //   usdtKeypair.publicKey,
    //   provider.publicKey,
    // );
    // userUsdcAtaAddr = (await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   payer,
    //   usdcKeypair.publicKey,
    //   provider.publicKey,
    // )).address;
    //
    // userUsdtAtaAddr = (await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   payer,
    //   usdtKeypair.publicKey,
    //   provider.publicKey,
    // )).address;
    //
    // userSwimUsdAtaAddr = (await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   payer,
    //   swimUsdKeypair.publicKey,
    //   provider.publicKey,
    // )).address;
    //
    // await mintTo(
    //   provider.connection,
    //   payer,
    //   usdcKeypair.publicKey,
    //   userUsdcAtaAddr,
    //   payer,
    //   1000000
    // );
    //
    // await mintTo(
    //   provider.connection,
    //   payer,
    //   usdtKeypair.publicKey,
    //   userUsdtAtaAddr,
    //   payer,
    //   1000000
    // );


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
  });

  it("Can add to pool", async () => {
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
      1_000_000_000
    );

    await mintTo(
      provider.connection,
      payer,
      usdtKeypair.publicKey,
      userUsdtAtaAddr,
      payer,
      1_000_000_000
    );
    const inputAmounts = [new anchor.BN(100_000), new anchor.BN(100_000)];
    const minimumMintAmount = new anchor.BN(0);
    const addParams = {
      inputAmounts,
      minimumMintAmount,
    }
    let userTransferAuthority = web3.Keypair.generate();
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
      .preInstructions([
          await splToken
            .methods
            .approve(inputAmounts[0])
            .accounts({
              source: userUsdcAtaAddr,
              delegate: userTransferAuthority.publicKey,
              authority: provider.publicKey
            })
            .signers([payer])
            .instruction(),
        await splToken
          .methods
          .approve(inputAmounts[1])
          .accounts({
            source: userUsdtAtaAddr,
            delegate: userTransferAuthority.publicKey,
            authority: provider.publicKey
          })
          .signers([payer])
          .instruction(),
      ])
      .postInstructions([
        await splToken
          .methods
          .revoke()
          .accounts({
            source: userUsdcAtaAddr,
            authority: provider.publicKey
          })
          .signers([payer])
          .instruction(),
        await splToken
          .methods
          .revoke()
          .accounts({
            source: userUsdtAtaAddr,
            authority: provider.publicKey
          })
          .signers([payer])
          .instruction(),
      ])
      .signers([userTransferAuthority]);

    const txSig = await tx.rpc({skipPreflight: true});

    console.log("Your transaction signature", txSig);

    const userLpTokenAccountBalance = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
    console.log(`userLpTokenAccountBalance: ${userLpTokenAccountBalance.toString()}`);
    assert(userLpTokenAccountBalance.gt(new anchor.BN(0)));
  });
});
