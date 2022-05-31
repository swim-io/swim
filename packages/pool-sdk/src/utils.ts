import {
  PublicKey,
  Keypair,
  Signer,
  AccountMeta,
  Transaction,
  Connection,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

import * as bs58 from "bs58";

export class AssertionError extends Error {
  name = "AssertionError";
}

export function assert(condition: any, message: string = "") {
  if (!condition)
    throw new AssertionError(message || "Assertion failed");
}

export function range(
  startOrStop: number,
  stop: number | null = null,
  step: number | null = null,
): readonly number[] {
  assert(stop === null && step === null, "not implemented yet");
  const length = startOrStop;
  return [...Array(length).keys()];
}

export function pick(obj: any, keys: string[]): any {
  return Object.fromEntries(keys.filter(key => key in obj).map(key => [key, obj[key]]));
}

export function toAccountMeta(pubkey: PublicKey, isWritable: boolean = false, isSigner: boolean = false): AccountMeta {
  return { pubkey, isSigner, isWritable };
}

export function secretToKeypair(secret: any): Keypair {
  let binarySecret = null;
  if (Array.isArray(secret)) {
    binarySecret = Uint8Array.from(secret);
  }
  else if (typeof secret === "string") {
    binarySecret = bs58.decode(secret);
  }
  else throw new Error("unsupported secret type");

  return Keypair.fromSecretKey(binarySecret);
}

export const msleep = (milliSec: number) => new Promise(resolve => setTimeout(resolve, milliSec));
export const sleep = (seconds: number) => msleep(seconds * 1000);

export async function createAccount(
  connection: Connection,
  payer: Signer,
  space: number,
  programId: PublicKey,
  accountKeys: Keypair = Keypair.generate(),
): Promise<Keypair> {
  const fromPubkey = payer.publicKey;
  const newAccountPubkey = accountKeys.publicKey;
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  const ix = SystemProgram.createAccount({fromPubkey, newAccountPubkey, lamports, space, programId});

  await sendAndConfirmTransaction(connection, new Transaction().add(ix), [payer, accountKeys]);

  return accountKeys;
}

export async function requestAirdrop(
  connection: Connection,
  account: PublicKey,
  lamports: number = LAMPORTS_PER_SOL
): Promise<void> {
  const txSig = await connection.requestAirdrop(account, lamports);
  await connection.confirmTransaction(txSig);
};

//redefinition of spl-token function which does not provide the allowOwnerOffCurve flag for some reason
export async function createAssociatedTokenAccount(
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
): Promise<PublicKey> {
  const associatedToken = await getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve);

  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(payer.publicKey, associatedToken, owner, mint)
  );

  await sendAndConfirmTransaction(connection, transaction, [payer]);

  return associatedToken;
}

//this is an amazingly stupid hack to get around the problem that, despite having finalized confirm options
//some accounts still fail to show up for quite a while after transaction confirmation...
//this only seems to be an issue for accounts that are created by an on-chain program though (e.g. through
//anchor's init property)
//issue only observed on devnet so far - not tested on other networks
export async function ensureAccountIsFound(connection: Connection, key: PublicKey) {
  for (let i = 0; i < 60; ++i) {
    if (await connection.getAccountInfo(key))
      return;
    await sleep(1);
  }
  throw new Error(`still couldn't find account for key ${key}, after waiting for a decent while`);
}
