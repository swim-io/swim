#!/usr/bin/env node

import * as anchor from "@project-serum/anchor";
import {web3, Spl} from "@project-serum/anchor";
import {
  TwoPoolContext, twoPoolToString,
  writePoolStateToFile,
} from "../src";

import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { setupPoolPrereqs, setupUserAssociatedTokenAccts } from "../tests/poolTestUtils";

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
const poolMintKeypairs = [usdcKeypair, usdtKeypair];
const poolMintDecimals = [mintDecimals, mintDecimals];
const poolMintAuthorities = [payer, payer];
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();
const pauseKeypair = web3.Keypair.generate();

const initialMintAmount = 1_000_000_000_000;

let poolUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let poolUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let governanceFeeAddr: web3.PublicKey = web3.PublicKey.default;

let userUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userSwimUsdAtaAddr: web3.PublicKey = web3.PublicKey.default;

const ampFactor  = { value: new anchor.BN(300), decimals: 0 };
const lpFee =  { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey  = web3.PublicKey.default;
type DecimalU64Anchor = {
  value: anchor.BN;
  decimals: number;
}

async function initialize(){
  ({
    poolPubkey: flagshipPool,
    poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
    governanceFeeAccount: governanceFeeAddr,
  } = await setupPoolPrereqs(
    program,
    splToken,
    poolMintKeypairs,
    poolMintDecimals,
    poolMintAuthorities.map((keypair) => keypair.publicKey),
    swimUsdKeypair.publicKey,
    governanceKeypair.publicKey,
  ));
  const params = {
    ampFactor,
    lpFee,
    governanceFee,
  }
  const tx = await program
    .methods
    // .initialize(params)
    .initialize(
      ampFactor,
      lpFee,
      governanceFee
    )
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

  ({
    userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
    userLpTokenAta: userSwimUsdAtaAddr
  }  = await setupUserAssociatedTokenAccts(
    provider.connection,
    provider.publicKey,
    poolMintKeypairs.map(kp => kp.publicKey),
    poolMintAuthorities,
    swimUsdKeypair.publicKey,
    initialMintAmount,
    payer
  ));
}

async function add() {

}


async function main() {
  await initialize();
}

main();
