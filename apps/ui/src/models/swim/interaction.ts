import type Decimal from "decimal.js";

import type { EcosystemId, Env } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import type { Amount } from "../amount";

/**
 * Essentially a duplicate of SwimDefiInstruction but conceptually distinct because a swap
 * interaction may involve multiple instructions
 */
export enum InteractionType {
  Swap,
  Add,
  RemoveUniform,
  RemoveExactBurn,
  RemoveExactOutput,
  SwapV2,
}

export const INTERACTION_GROUP_SWAP = new Set([InteractionType.Swap]);
export const INTERACTION_GROUP_ADD = new Set([InteractionType.Add]);
export const INTERACTION_GROUP_REMOVE = new Set([
  InteractionType.RemoveUniform,
  InteractionType.RemoveExactBurn,
  InteractionType.RemoveExactOutput,
]);
export const INTERACTION_GROUPS = [
  INTERACTION_GROUP_SWAP,
  INTERACTION_GROUP_ADD,
  INTERACTION_GROUP_REMOVE,
];

interface BaseInteractionSpec {
  readonly type: InteractionType;
  /** Should be overriden when extending this type */
  readonly params: unknown;
}

export interface SwapInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Swap;
  readonly params: {
    readonly exactInputAmount: Amount;
    readonly minimumOutputAmount: Amount;
  };
}

export interface AddInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Add;
  readonly poolId: string;
  readonly params: {
    readonly inputAmounts: readonly Amount[];
    readonly minimumMintAmount: Amount;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface RemoveUniformInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveUniform;
  readonly poolId: string;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: readonly Amount[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactBurnInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactBurn;
  readonly poolId: string;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmount: Amount;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactOutputInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactOutput;
  readonly poolId: string;
  readonly params: {
    readonly maximumBurnAmount: Amount;
    readonly exactOutputAmounts: readonly Amount[];
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export type InteractionSpec =
  | SwapInteractionSpec
  | AddInteractionSpec
  | RemoveUniformInteractionSpec
  | RemoveExactBurnInteractionSpec
  | RemoveExactOutputInteractionSpec;

interface BaseInteraction {
  readonly id: string;
  // TODO: Make less redundant with poolId on non-Swap InteractionSpecs
  readonly poolIds: readonly string[];
  readonly env: Env;
  readonly submittedAt: number;
  readonly connectedWallets: ReadonlyRecord<EcosystemId, string | null>;
}

export interface AddInteraction extends BaseInteraction, AddInteractionSpec {}

export interface RemoveUniformInteraction
  extends BaseInteraction,
    RemoveUniformInteractionSpec {}

export interface RemoveExactBurnInteraction
  extends BaseInteraction,
    RemoveExactBurnInteractionSpec {}

export interface RemoveExactOutputInteraction
  extends BaseInteraction,
    RemoveExactOutputInteractionSpec {}

export interface SwapInteraction extends BaseInteraction, SwapInteractionSpec {}

export type Interaction =
  | AddInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction
  | SwapInteraction;

// V2 for Pool Restructure
export interface TokenTransferDetail {
  readonly tokenId: string;
  readonly ecosystemId: EcosystemId;
  readonly value: Decimal;
}

export interface SwapInteractionSpecV2 extends BaseInteractionSpec {
  readonly type: InteractionType.SwapV2;
  readonly params: {
    readonly fromTokenDetail: TokenTransferDetail;
    readonly toTokenDetail: TokenTransferDetail;
  };
}

export type InteractionSpecV2 =
  | SwapInteractionSpecV2
  | AddInteractionSpec
  | RemoveUniformInteractionSpec
  | RemoveExactBurnInteractionSpec
  | RemoveExactOutputInteractionSpec;

export interface SwapInteractionV2
  extends BaseInteraction,
    SwapInteractionSpecV2 {}

export type InteractionV2 =
  | AddInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction
  | SwapInteractionV2;

export const enum InteractionStatusV2 {
  Incomplete,
  Active,
  Completed,
  Error,
}
