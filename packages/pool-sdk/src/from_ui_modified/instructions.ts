import type { Layout } from "@project-serum/borsh";
import { array, struct, u64, i64, u8, bool, publicKey } from "@project-serum/borsh";
import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

import type { DecimalBN } from "../from_ui/decimal";
import { decimal } from "../from_ui/decimal";

export enum SwimInstruction {
  Init,
  DeFi,
  Governance,
}

export enum SwimDefiInstruction {
  Add,
  Swap,
  SwapExactOutput,
  RemoveUniform,
  RemoveExactBurn,
  RemoveExactOutput,
}

export enum SwimGovernanceInstruction {
  PrepareFeeChange,
  EnactFeeChange,
  PrepareGovernanceTransition,
  EnactGovernanceTransition,
  ChangeGovernanceFeeAccount,
  AdjustAmpFactor,
  SetPaused,
}

export interface InitInstruction {
  readonly instruction: SwimInstruction.Init;
  readonly nonce: number;
  readonly ampFactor: DecimalBN;
  readonly lpFee: DecimalBN;
  readonly governanceFee: DecimalBN;
}

export const initInstruction = (property = "initInstruction"): Layout<InitInstruction> =>
  struct([u8("instruction"), u8("nonce"), decimal("ampFactor"), decimal("lpFee"), decimal("governanceFee")], property);

export interface AddInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.Add;
  readonly inputAmounts: readonly BN[];
  readonly minimumMintAmount: BN;
}

export const addInstruction = (
  numberOfTokens: number,
  property = "addInstruction",
): Layout<AddInstruction> =>
  struct(
    [u8("instruction"), u8("defiInstruction"), array(u64(), numberOfTokens, "inputAmounts"), u64("minimumMintAmount")],
    property,
  );

export interface SwapInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.Swap;
  readonly exactInputAmounts: readonly BN[];
  readonly outputTokenIndex: number;
  readonly minimumOutputAmount: BN;
}

export const swapInstruction = (
  numberOfTokens: number,
  property = "swapInstruction",
): Layout<SwapInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      array(u64(), numberOfTokens, "exactInputAmounts"),
      u8("outputTokenIndex"),
      u64("minimumOutputAmount"),
    ],
    property,
  );

export interface RemoveUniformInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveUniform;
  readonly exactBurnAmount: BN;
  readonly minimumOutputAmounts: readonly BN[];
}

export const removeUniformInstruction = (
  numberOfTokens: number,
  property = "removeUniformInstruction",
): Layout<RemoveUniformInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      u64("exactBurnAmount"),
      array(u64(), numberOfTokens, "minimumOutputAmounts"),
    ],
    property,
  );

export interface RemoveExactBurnInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveExactBurn;
  readonly exactBurnAmount: BN;
  readonly outputTokenIndex: number;
  readonly minimumOutputAmount: BN;
}

export const removeExactBurnInstruction = (
  property = "removeExactBurnInstruction",
): Layout<RemoveExactBurnInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      u64("exactBurnAmount"),
      u8("outputTokenIndex"),
      u64("minimumOutputAmount"),
    ],
    property,
  );

export interface RemoveExactOutputInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveExactOutput;
  readonly maximumBurnAmount: BN;
  readonly exactOutputAmounts: readonly BN[];
}

export const removeExactOutputInstruction = (
  numberOfTokens: number,
  property = "removeExactOutputInstruction",
): Layout<RemoveExactOutputInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      u64("maximumBurnAmount"),
      array(u64(), numberOfTokens, "exactOutputAmounts"),
    ],
    property,
  );

export interface PrepareFeeChangeInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.PrepareFeeChange;
  readonly lpFee: DecimalBN;
  readonly governanceFee: DecimalBN;
}

export const prepareFeeChangeInstruction = (
  property = "prepareFeeChangeInstruction",
): Layout<PrepareFeeChangeInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction"), decimal("lpFee"), decimal("governanceFee")], property);

export interface EnactFeeChangeInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.EnactFeeChange;
}

export const enactFeeChangeInstruction = (
  property = "enactFeeChangeInstruction",
): Layout<EnactFeeChangeInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction")], property);

export interface PrepareGovernanceTransitionInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.PrepareGovernanceTransition;
  readonly upcomingGovernanceKey: PublicKey;
}

export const prepareGovernanceTransitionInstruction = (
  property = "prepareGovernanceTransitionInstruction",
): Layout<PrepareGovernanceTransitionInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction"), publicKey("upcomingGovernanceKey")], property);

export interface EnactGovernanceTransitionInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.EnactGovernanceTransition;
}

export const enactGovernanceTransitionInstruction = (
  property = "enactGovernanceTransitionInstruction",
): Layout<EnactGovernanceTransitionInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction")], property);

export interface ChangeGovernanceFeeAccountInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.ChangeGovernanceFeeAccount;
  readonly governanceFeeKey: PublicKey;
}

export const changeGovernanceFeeAccountInstruction = (
  property = "changeGovernanceFeeAccountInstruction",
): Layout<ChangeGovernanceFeeAccountInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction"), publicKey("governanceFeeKey")], property);

export interface AdjustAmpFactorInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.AdjustAmpFactor;
  readonly targetTs: BN;
  readonly targetValue: DecimalBN;
}

export const adjustAmpFactorInstruction = (
  property = "adjustAmpFactorInstruction",
): Layout<AdjustAmpFactorInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction"), i64("targetTs"), decimal("targetValue")], property);

export interface SetPausedInstruction {
  readonly instruction: SwimInstruction.Governance;
  readonly governanceInstruction: SwimGovernanceInstruction.SetPaused;
  readonly paused: boolean;
}

export const setPausedInstruction = (
  property = "setPausedInstruction",
): Layout<SetPausedInstruction> =>
  struct([u8("instruction"), u8("governanceInstruction"), bool("paused")], property);
