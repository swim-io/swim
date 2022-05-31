import type { Amount } from "../amount";

import type { SwimDefiInstruction } from "./instructions";

interface BaseOperationSpec {
  readonly interactionId: string;
  readonly poolId: string;
  readonly instruction: SwimDefiInstruction;
  /** Should be overriden when extending this type */
  readonly params: unknown;
}

export interface AddOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.Add;
  readonly params: {
    readonly inputAmounts: readonly Amount[];
    readonly minimumMintAmount: Amount;
  };
}

export interface RemoveUniformOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.RemoveUniform;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: readonly Amount[];
  };
}

export interface RemoveExactBurnOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.RemoveExactBurn;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: Amount;
  };
}

export interface RemoveExactOutputOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.RemoveExactOutput;
  readonly params: {
    readonly maximumBurnAmount: Amount;
    readonly exactOutputAmounts: readonly Amount[];
  };
}

export interface SwapOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.Swap;
  readonly params: {
    readonly exactInputAmounts: readonly Amount[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: Amount;
  };
}

export type OperationSpec =
  | AddOperationSpec
  | RemoveUniformOperationSpec
  | RemoveExactBurnOperationSpec
  | RemoveExactOutputOperationSpec
  | SwapOperationSpec;
