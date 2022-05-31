import { PublicKey, Keypair, Signer, AccountMeta, Connection } from '@solana/web3.js';
export declare class AssertionError extends Error {
    name: string;
}
export declare function assert(condition: any, message?: string): void;
export declare function range(startOrStop: number, stop?: number | null, step?: number | null): readonly number[];
export declare function pick(obj: any, keys: string[]): any;
export declare function toAccountMeta(pubkey: PublicKey, isWritable?: boolean, isSigner?: boolean): AccountMeta;
export declare function secretToKeypair(secret: any): Keypair;
export declare const msleep: (milliSec: number) => Promise<unknown>;
export declare const sleep: (seconds: number) => Promise<unknown>;
export declare function createAccount(connection: Connection, payer: Signer, space: number, programId: PublicKey, accountKeys?: Keypair): Promise<Keypair>;
export declare function requestAirdrop(connection: Connection, account: PublicKey, lamports?: number): Promise<void>;
export declare function createAssociatedTokenAccount(connection: Connection, payer: Signer, mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean): Promise<PublicKey>;
export declare function ensureAccountIsFound(connection: Connection, key: PublicKey): Promise<void>;
