import type { Layout } from "@project-serum/borsh";
import { array, struct, u64, u8 } from "@project-serum/borsh";
import type BN from "bn.js";

import type { DecimalBN } from "@swim-io/solana-types";
import { decimal } from "@swim-io/solana-types";

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

export interface InitDefiInstruction {
  readonly instruction: SwimInstruction.Init;
  readonly nonce: number;
  readonly ampFactor: DecimalBN;
  readonly lpFee: DecimalBN;
  readonly governanceFee: DecimalBN;
}

export const initInstruction = (
  property = "initInstruction",
): Layout<InitDefiInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("nonce"),
      decimal("ampFactor"),
      decimal("lpFee"),
      decimal("governanceFee"),
    ],
    property,
  );

export interface AddDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.Add;
  readonly inputAmounts: readonly BN[];
  readonly minimumMintAmount: BN;
}

export const defiAddInstruction = (
  numberOfTokens: number,
  property = "defiAddInstruction",
): Layout<AddDefiInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      array(u64(), numberOfTokens, "inputAmounts"),
      u64("minimumMintAmount"),
    ],
    property,
  );

export interface SwapDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.Swap;
  readonly exactInputAmounts: readonly BN[];
  readonly outputTokenIndex: number;
  readonly minimumOutputAmount: BN;
}

export const defiSwapInstruction = (
  numberOfTokens: number,
  property = "defiSwapInstruction",
): Layout<SwapDefiInstruction> =>
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

export interface RemoveUniformDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveUniform;
  readonly exactBurnAmount: BN;
  readonly minimumOutputAmounts: readonly BN[];
}

export const defiRemoveUniformInstruction = (
  numberOfTokens: number,
  property = "defiRemoveUniformInstruction",
): Layout<RemoveUniformDefiInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      u64("exactBurnAmount"),
      array(u64(), numberOfTokens, "minimumOutputAmounts"),
    ],
    property,
  );

export interface RemoveExactBurnDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveExactBurn;
  readonly exactBurnAmount: BN;
  readonly outputTokenIndex: number;
  readonly minimumOutputAmount: BN;
}

export const defiRemoveExactBurnInstruction = (
  property = "defiRemoveExactBurnInstruction",
): Layout<RemoveExactBurnDefiInstruction> =>
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

export interface RemoveExactOutputDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.RemoveExactOutput;
  readonly maximumBurnAmount: BN;
  readonly exactOutputAmounts: readonly BN[];
}

export const defiRemoveExactOutputInstruction = (
  numberOfTokens: number,
  property = "defiRemoveExactOutputInstruction",
): Layout<RemoveExactOutputDefiInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      u64("maximumBurnAmount"),
      array(u64(), numberOfTokens, "exactOutputAmounts"),
    ],
    property,
  );
