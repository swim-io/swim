import type { Program, SplToken } from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import type { Commitment, ConfirmOptions } from "@solana/web3.js";

import type { TwoPool } from "../../src/artifacts/two_pool";

/**
 * It initializes the mints for the tokens that will be used in the pool, and then *CALCULATES* the pool token accounts and
 * the governance fee account addresses
 * @param program - The program that will be used to create the pool.
 * @param splToken - The program that implements the SPL token standard.
 * @param mintKeypairs - Array<web3.Keypair>
 * @param mintDecimals - the number of decimals for each mint
 * @param mintAuthorities - The public keys of the accounts that can mint the underlying tokens.
 * @param lpMint - the public key of the account that will receive the governance fee
 * @param governanceFeeOwner - The account that will receive the governance fee.
 */
export async function setupPoolPrereqs(
  program: Program<TwoPool>,
  splToken: Program<SplToken>,
  mintKeypairs: ReadonlyArray<web3.Keypair>,
  mintDecimals: ReadonlyArray<number>,
  mintAuthorities: ReadonlyArray<web3.PublicKey>,
  lpMint: web3.PublicKey,
  governanceFeeOwner: web3.PublicKey,
) {
  const poolTokenAccounts = [];
  for (let i = 0; i < mintKeypairs.length; i++) {
    const mintKeypair = mintKeypairs[i];
    const mintDecimal = mintDecimals[i];
    try {
      const mint = await splToken.account.mint.fetch(mintKeypair.publicKey);
      console.log(
        `existing mint info found for ${
          mintKeypair.publicKey
        }: ${JSON.stringify(mint)}`,
      );
    } catch (e) {
      console.log(`mint not found. Initializing now. error: ${e}`);
      await splToken.methods
        .initializeMint(mintDecimal, program.provider.publicKey!, null)
        .accounts({
          mint: mintKeypair.publicKey,
        })
        .preInstructions([
          await splToken.account.mint.createInstruction(mintKeypair),
        ])
        .signers([mintKeypair])
        .rpc();
    }
  }

  const [poolPubkey] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("two_pool"),
      ...mintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      lpMint.toBytes(),
    ],
    program.programId,
  );

  for (let i = 0; i < mintKeypairs.length; i++) {
    const mintKeypair = mintKeypairs[i];
    const poolTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      poolPubkey,
      true,
    );
    poolTokenAccounts.push(poolTokenAccount);
  }

  console.log(`initialized pool token accounts`);

  const governanceFeeAccount = await getAssociatedTokenAddress(
    lpMint,
    governanceFeeOwner,
  );

  console.log(`initialized governance fee account`);

  console.log(`
      pool token accounts: ${JSON.stringify(poolTokenAccounts)}
      governance fee account: ${governanceFeeAccount}
    `);
  return {
    poolPubkey,
    poolTokenAccounts,
    governanceFeeAccount,
  };
}

export async function setupUserAssociatedTokenAccts(
  connection: web3.Connection,
  owner: web3.PublicKey,
  mints: ReadonlyArray<web3.PublicKey>,
  mintAuthorities: ReadonlyArray<web3.Keypair>,
  lpMint: web3.PublicKey,
  amount: number | bigint,
  payer: web3.Keypair,
  commitment?: Commitment,
  confirmOptions?: ConfirmOptions,
) {
  const userPoolTokenAtas: ReadonlyArray<web3.PublicKey> = [];
  for (let i = 0; i < mints.length; i++) {
    const mint = mints[i];
    const mintAuthority = mintAuthorities[i];
    const userAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner,
        false,
        commitment,
        confirmOptions,
      )
    ).address;
    console.log(`mint[${i}]: ${mint}. created/retrieved userAta: ${userAta}`);
    await mintTo(connection, payer, mint, userAta, mintAuthority, amount);
    console.log(`minted ${amount} to ${userAta}`);
    userPoolTokenAtas.push(userAta);
  }
  const userLpTokenAta = (
    await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpMint,
      owner,
      false,
      commitment,
      confirmOptions,
    )
  ).address;
  console.log(
    `lpMint: ${lpMint}. created/retrieved userLpTokenAta: ${userLpTokenAta}`,
  );
  return {
    userPoolTokenAtas,
    userLpTokenAta,
  };
}
