import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { Keypair } from "@solana/web3.js";

import type { EcosystemId, Env } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import type { Amount } from "../amount";

import type { SwimDefiInstruction } from "./instructions";

export type AmountsByTokenId = ReadonlyMap<string, Amount>;

interface BaseOperationSpec {
  readonly interactionId: string;
  readonly poolId: string;
  readonly instruction: SwimDefiInstruction;
  /** Should be overriden when extending this type */
  readonly params: unknown;
}

export interface SwapOperationSpec extends BaseOperationSpec {
  readonly instruction: SwimDefiInstruction.Swap;
  readonly params: {
    readonly exactInputAmounts: readonly Amount[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: Amount;
  };
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

export type OperationSpec =
  | SwapOperationSpec
  | AddOperationSpec
  | RemoveUniformOperationSpec
  | RemoveExactBurnOperationSpec
  | RemoveExactOutputOperationSpec;

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
}

interface BaseInteractionSpec {
  readonly type: InteractionType;
  /** Should be overriden when extending this type */
  readonly params: unknown;
}

export interface SwapInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Swap;
  readonly params: {
    readonly exactInputAmounts: AmountsByTokenId;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: Amount;
  };
}

export interface AddInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Add;
  readonly params: {
    readonly inputAmounts: AmountsByTokenId;
    readonly minimumMintAmount: Amount;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface RemoveUniformInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveUniform;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: AmountsByTokenId;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactBurnInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactBurn;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly outputTokenId: string;
    readonly minimumOutputAmount: Amount;
  };
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactOutputInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveExactOutput;
  readonly params: {
    readonly maximumBurnAmount: Amount;
    readonly exactOutputAmounts: AmountsByTokenId;
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
  readonly env: Env;
  readonly submittedAt: number;
  /** Record of token ID to keypairs for a signature set used in posting Wormhole VAAs to Solana */
  readonly signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>;
  /** Previous keypairs for use finding txs */
  readonly previousSignatureSetAddresses: ReadonlyRecord<
    string,
    string | undefined
  >;
  readonly connectedWallets: ReadonlyRecord<EcosystemId, string | null>;
}

export interface AddInteraction extends BaseInteraction, AddInteractionSpec {}

export interface SwapInteraction extends BaseInteraction, SwapInteractionSpec {}

export interface RemoveUniformInteraction
  extends BaseInteraction,
    RemoveUniformInteractionSpec {}

export interface RemoveExactBurnInteraction
  extends BaseInteraction,
    RemoveExactBurnInteractionSpec {}

export interface RemoveExactOutputInteraction
  extends BaseInteraction,
    RemoveExactOutputInteractionSpec {}

export type Interaction =
  | AddInteraction
  | SwapInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction;

export type WithSplTokenAccounts<T> = T & {
  readonly splTokenAccounts: readonly TokenAccount[];
};
