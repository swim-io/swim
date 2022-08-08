#!/usr/bin/env node

import * as anchor from "@project-serum/anchor";
import {web3, Spl} from "@project-serum/anchor";
import { Program, SplToken } from "@project-serum/anchor";
import {
  TwoPoolContext, twoPoolToString,
  writePoolStateToFile,
} from "@swim-io/swim-anchor-sdk";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Account, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
// const connectionUrl = "https://devnet.genesysgo.net/";

// const provider = anchor.AnchorProvider.local(
//   connectionUrl,
//   {commitment: "confirmed"}
// );
const provider = anchor.AnchorProvider.env();
const payer = (provider.wallet as NodeWallet).payer;

console.log(`anchorProvider pubkey: ${provider.publicKey.toBase58()}`);

const programId = new web3.PublicKey(
  "8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM"
);


const twoPoolContext = TwoPoolContext.withProvider(
  provider,
  programId
);

const program = twoPoolContext.program;


const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
const mintDecimals = 6;
const usdcKeypair = web3.Keypair.generate();
const usdtKeypair = web3.Keypair.generate();
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();

let poolUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let poolUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let governanceFeeAddr: web3.PublicKey = web3.PublicKey.default;
let governanceFeeAccount: Account;

let userUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userSwimUsdAtaAddr: web3.PublicKey = web3.PublicKey.default;

const ampFactor  = { value: new anchor.BN(300), decimals: 0 };
const lpFee =  { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFeeValue = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey  = web3.PublicKey.default;


async function initialize(){
  console.log("hi2");
  await setup();
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
  console.log(`poolKey: ${pool!.toBase58()}, expected: ${flagshipPool.toBase58()}`);

  const txSig = await tx.rpc(
    {commitment: "confirmed"},
  );


  console.log("Your transaction signature", txSig);
  await provider.connection.confirmTransaction(
    {
      signature: txSig,
      ...(await provider.connection.getLatestBlockhash())
    }
  );
  console.log("Transaction has been confirmed");

  let path = "/tmp/two_pool_state.json";
  let twoPoolStr = await twoPoolToString(program, flagshipPool);

  writePoolStateToFile(path, twoPoolStr);

  await setupUserAssociatedTokenAccts();
}

async function add() {

}

async function setup() {
  // await provider.connection.requestAirdrop(provider.publicKey, LAMPORTS_PER_SOL);
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
}

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

async function main() {
  await initialize();
}

main();
