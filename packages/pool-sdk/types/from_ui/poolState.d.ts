import type { Layout } from "@project-serum/borsh";
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { AmpFactor } from "./ampFactor";
export interface SwimPoolState {
    readonly nonce: number;
    readonly isPaused: boolean;
    readonly ampFactor: AmpFactor;
    readonly lpFee: number;
    readonly governanceFee: number;
    readonly lpMintKey: PublicKey;
    readonly lpDecimalEqualizer: number;
    readonly tokenMintKeys: readonly PublicKey[];
    readonly tokenDecimalEqualizers: readonly number[];
    readonly tokenKeys: readonly PublicKey[];
    readonly governanceKey: PublicKey;
    readonly governanceFeeKey: PublicKey;
    readonly preparedGovernanceKey: PublicKey;
    readonly governanceTransitionTs: BN;
    readonly preparedLpFee: number;
    readonly preparedGovernanceFee: number;
    readonly feeTransitionTs: BN;
    readonly previousDepth: BN;
}
export declare const swimPool: (numberOfTokens: number, property?: string) => Layout<SwimPoolState>;
export declare const deserializeSwimPool: (numberOfTokens: number, poolData: Buffer) => SwimPoolState;
