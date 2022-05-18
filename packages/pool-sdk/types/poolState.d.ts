/// <reference types="node" />
import { PublicKey, Connection } from "@solana/web3.js";
import type { AmpFactor as AmpFactorBorsh } from "./from_ui/ampFactor";
import type { SwimPoolState as PoolStateBorsh } from "./from_ui/poolState";
import { Decimal, Timestamp } from "./common";
export declare function programIdFromTokenCount(tokenCount: number): PublicKey;
export declare function dataSizeFromTokenCount(tokenCount: number): number;
export declare function tokenCountFromDataSize(bytes: number): number;
export declare function calcPoolAuthority(tokenCount: number, poolStateKey: PublicKey, nonce: number): PublicKey;
export declare class AmpFactor {
    readonly initialValue: Decimal;
    readonly initialTs: Timestamp;
    readonly targetValue: Decimal;
    readonly targetTs: Timestamp;
    constructor(initialValue: Decimal, initialTs: Timestamp, targetValue: Decimal, targetTs: Timestamp);
    static from(borsh: AmpFactorBorsh): AmpFactor;
    get(blockTs: Timestamp): Decimal;
}
export interface ConstantStateData {
    nonce: number;
    lpMintKey: PublicKey;
    lpDecimalEqualizer: number;
    tokenMintKeys: readonly PublicKey[];
    tokenDecimalEqualizers: readonly number[];
    tokenKeys: readonly PublicKey[];
}
export interface MutableStateData {
    isPaused: boolean;
    ampFactor: AmpFactor;
    lpFee: Decimal;
    governanceFee: Decimal;
    governanceKey: PublicKey;
    governanceFeeKey: PublicKey;
    preparedGovernanceKey: PublicKey;
    governanceTransitionTs: Timestamp;
    preparedLpFee: Decimal;
    preparedGovernanceFee: Decimal;
    feeTransitionTs: Timestamp;
    previousDepth: Decimal;
}
export declare class PoolState implements ConstantStateData, MutableStateData {
    readonly address: PublicKey;
    readonly nonce: number;
    readonly isPaused: boolean;
    readonly ampFactor: AmpFactor;
    readonly lpFee: Decimal;
    readonly governanceFee: Decimal;
    readonly lpMintKey: PublicKey;
    readonly lpDecimalEqualizer: number;
    readonly tokenMintKeys: readonly PublicKey[];
    readonly tokenDecimalEqualizers: readonly number[];
    readonly tokenKeys: readonly PublicKey[];
    readonly governanceKey: PublicKey;
    readonly governanceFeeKey: PublicKey;
    readonly preparedGovernanceKey: PublicKey;
    readonly governanceTransitionTs: Timestamp;
    readonly preparedLpFee: Decimal;
    readonly preparedGovernanceFee: Decimal;
    readonly feeTransitionTs: Timestamp;
    readonly previousDepth: Decimal;
    readonly authority: PublicKey;
    readonly programId: PublicKey;
    constructor(address: PublicKey, nonce: number, isPaused: boolean, ampFactor: AmpFactor, lpFee: Decimal, governanceFee: Decimal, lpMintKey: PublicKey, lpDecimalEqualizer: number, tokenMintKeys: readonly PublicKey[], tokenDecimalEqualizers: readonly number[], tokenKeys: readonly PublicKey[], governanceKey: PublicKey, governanceFeeKey: PublicKey, preparedGovernanceKey: PublicKey, governanceTransitionTs: Timestamp, preparedLpFee: Decimal, preparedGovernanceFee: Decimal, feeTransitionTs: Timestamp, previousDepth: Decimal);
    static from(address: PublicKey, data: PoolStateBorsh | Buffer): PoolState;
    get tokenCount(): number;
}
export declare function getPoolState(connection: Connection, address: PublicKey): Promise<PoolState>;
