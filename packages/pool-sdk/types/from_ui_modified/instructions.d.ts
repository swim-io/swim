import type { Layout } from "@project-serum/borsh";
import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";
import type { DecimalBN } from "../from_ui/decimal";
export declare enum SwimInstruction {
    Init = 0,
    DeFi = 1,
    Governance = 2
}
export declare enum SwimDefiInstruction {
    Add = 0,
    Swap = 1,
    SwapExactOutput = 2,
    RemoveUniform = 3,
    RemoveExactBurn = 4,
    RemoveExactOutput = 5
}
export declare enum SwimGovernanceInstruction {
    PrepareFeeChange = 0,
    EnactFeeChange = 1,
    PrepareGovernanceTransition = 2,
    EnactGovernanceTransition = 3,
    ChangeGovernanceFeeAccount = 4,
    AdjustAmpFactor = 5,
    SetPaused = 6
}
export interface InitInstruction {
    readonly instruction: SwimInstruction.Init;
    readonly nonce: number;
    readonly ampFactor: DecimalBN;
    readonly lpFee: DecimalBN;
    readonly governanceFee: DecimalBN;
}
export declare const initInstruction: (property?: string) => Layout<InitInstruction>;
export interface AddInstruction {
    readonly instruction: SwimInstruction.DeFi;
    readonly defiInstruction: SwimDefiInstruction.Add;
    readonly inputAmounts: readonly BN[];
    readonly minimumMintAmount: BN;
}
export declare const addInstruction: (numberOfTokens: number, property?: string) => Layout<AddInstruction>;
export interface SwapInstruction {
    readonly instruction: SwimInstruction.DeFi;
    readonly defiInstruction: SwimDefiInstruction.Swap;
    readonly exactInputAmounts: readonly BN[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: BN;
}
export declare const swapInstruction: (numberOfTokens: number, property?: string) => Layout<SwapInstruction>;
export interface RemoveUniformInstruction {
    readonly instruction: SwimInstruction.DeFi;
    readonly defiInstruction: SwimDefiInstruction.RemoveUniform;
    readonly exactBurnAmount: BN;
    readonly minimumOutputAmounts: readonly BN[];
}
export declare const removeUniformInstruction: (numberOfTokens: number, property?: string) => Layout<RemoveUniformInstruction>;
export interface RemoveExactBurnInstruction {
    readonly instruction: SwimInstruction.DeFi;
    readonly defiInstruction: SwimDefiInstruction.RemoveExactBurn;
    readonly exactBurnAmount: BN;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: BN;
}
export declare const removeExactBurnInstruction: (property?: string) => Layout<RemoveExactBurnInstruction>;
export interface RemoveExactOutputInstruction {
    readonly instruction: SwimInstruction.DeFi;
    readonly defiInstruction: SwimDefiInstruction.RemoveExactOutput;
    readonly maximumBurnAmount: BN;
    readonly exactOutputAmounts: readonly BN[];
}
export declare const removeExactOutputInstruction: (numberOfTokens: number, property?: string) => Layout<RemoveExactOutputInstruction>;
export interface PrepareFeeChangeInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.PrepareFeeChange;
    readonly lpFee: DecimalBN;
    readonly governanceFee: DecimalBN;
}
export declare const prepareFeeChangeInstruction: (property?: string) => Layout<PrepareFeeChangeInstruction>;
export interface EnactFeeChangeInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.EnactFeeChange;
}
export declare const enactFeeChangeInstruction: (property?: string) => Layout<EnactFeeChangeInstruction>;
export interface PrepareGovernanceTransitionInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.PrepareGovernanceTransition;
    readonly upcomingGovernanceKey: PublicKey;
}
export declare const prepareGovernanceTransitionInstruction: (property?: string) => Layout<PrepareGovernanceTransitionInstruction>;
export interface EnactGovernanceTransitionInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.EnactGovernanceTransition;
}
export declare const enactGovernanceTransitionInstruction: (property?: string) => Layout<EnactGovernanceTransitionInstruction>;
export interface ChangeGovernanceFeeAccountInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.ChangeGovernanceFeeAccount;
    readonly governanceFeeKey: PublicKey;
}
export declare const changeGovernanceFeeAccountInstruction: (property?: string) => Layout<ChangeGovernanceFeeAccountInstruction>;
export interface AdjustAmpFactorInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.AdjustAmpFactor;
    readonly targetTs: BN;
    readonly targetValue: DecimalBN;
}
export declare const adjustAmpFactorInstruction: (property?: string) => Layout<AdjustAmpFactorInstruction>;
export interface SetPausedInstruction {
    readonly instruction: SwimInstruction.Governance;
    readonly governanceInstruction: SwimGovernanceInstruction.SetPaused;
    readonly paused: boolean;
}
export declare const setPausedInstruction: (property?: string) => Layout<SetPausedInstruction>;
