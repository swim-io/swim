import type { Keypair } from "@solana/web3.js";

import type { EcosystemId, Env } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import type { Amount } from "../amount";

export type AmountsByTokenId = ReadonlyMap<string, Amount>;

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
    readonly exactInputAmount: Amount;
    readonly minimumOutputAmount: Amount;
  };
}

export interface AddInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.Add;
  readonly poolId: string;
  readonly params: {
    readonly inputAmounts: AmountsByTokenId;
    readonly minimumMintAmount: Amount;
  };
  readonly lpTokenTargetEcosystem: EcosystemId;
}

export interface RemoveUniformInteractionSpec extends BaseInteractionSpec {
  readonly type: InteractionType.RemoveUniform;
  readonly poolId: string;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: AmountsByTokenId;
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
  // TODO: Make less redundant with poolId on non-Swap InteractionSpecs
  readonly poolIds: readonly string[];
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
