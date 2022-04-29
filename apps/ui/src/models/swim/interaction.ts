import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import type { Keypair } from "@solana/web3.js";

import type { EcosystemId, Env } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import type { Amount } from "../amount";

import type { SwimDefiInstruction } from "./instructions";

export interface BasePoolInteraction {
  readonly id: string;
  readonly env: Env;
  readonly poolId: string;
  readonly submittedAt: number;
}

export interface AddPoolInteraction extends BasePoolInteraction {
  readonly instruction: SwimDefiInstruction.Add;
  readonly params: {
    readonly inputAmounts: readonly Amount[];
    readonly minimumMintAmount: Amount;
  };
}

export interface SwapPoolInteraction extends BasePoolInteraction {
  readonly instruction: SwimDefiInstruction.Swap;
  readonly params: {
    readonly exactInputAmounts: readonly Amount[];
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: Amount;
  };
}

export interface RemoveUniformPoolInteraction extends BasePoolInteraction {
  readonly instruction: SwimDefiInstruction.RemoveUniform;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly minimumOutputAmounts: readonly Amount[];
  };
}

export interface RemoveExactBurnPoolInteraction extends BasePoolInteraction {
  readonly instruction: SwimDefiInstruction.RemoveExactBurn;
  readonly params: {
    readonly exactBurnAmount: Amount;
    readonly outputTokenIndex: number;
    readonly minimumOutputAmount: Amount;
  };
}

export interface RemoveExactOutputPoolInteraction extends BasePoolInteraction {
  readonly instruction: SwimDefiInstruction.RemoveExactOutput;
  readonly params: {
    readonly maximumBurnAmount: Amount;
    readonly exactOutputAmounts: readonly Amount[];
  };
}

export type PoolInteraction =
  | AddPoolInteraction
  | SwapPoolInteraction
  | RemoveUniformPoolInteraction
  | RemoveExactBurnPoolInteraction
  | RemoveExactOutputPoolInteraction;

export type WithSplTokenAccounts<T> = T & {
  readonly splTokenAccounts: readonly TokenAccount[];
};

export interface SwimInteraction extends BasePoolInteraction {
  /** Record of token ID to keypairs for a signature set used in posting Wormhole VAAs to Solana */
  readonly signatureSetKeypairs: ReadonlyRecord<string, Keypair | undefined>;
  /** Previous keypairs for use finding txs */
  readonly previousSignatureSetAddresses: ReadonlyRecord<
    string,
    string | undefined
  >;
  readonly connectedWallets: ReadonlyRecord<EcosystemId, string | null>;
}

export interface AddInteraction extends AddPoolInteraction, SwimInteraction {
  readonly lpTokenTargetEcosystem: EcosystemId;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SwapInteraction extends SwapPoolInteraction, SwimInteraction {}

export interface RemoveUniformInteraction
  extends RemoveUniformPoolInteraction,
    SwimInteraction {
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactBurnInteraction
  extends RemoveExactBurnPoolInteraction,
    SwimInteraction {
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export interface RemoveExactOutputInteraction
  extends RemoveExactOutputPoolInteraction,
    SwimInteraction {
  readonly lpTokenSourceEcosystem: EcosystemId;
}

export type Interaction =
  | AddInteraction
  | SwapInteraction
  | RemoveUniformInteraction
  | RemoveExactBurnInteraction
  | RemoveExactOutputInteraction;

export type AddInteractionSpec = Pick<
  AddInteraction,
  "instruction" | "params" | "lpTokenTargetEcosystem"
>;

export type SwapInteractionSpec = Pick<
  SwapInteraction,
  "instruction" | "params"
>;

export type RemoveUniformInteractionSpec = Pick<
  RemoveUniformInteraction,
  "instruction" | "params" | "lpTokenSourceEcosystem"
>;

export type RemoveExactBurnInteractionSpec = Pick<
  RemoveExactBurnInteraction,
  "instruction" | "params" | "lpTokenSourceEcosystem"
>;

export type RemoveExactOutputInteractionSpec = Pick<
  RemoveExactOutputInteraction,
  "instruction" | "params" | "lpTokenSourceEcosystem"
>;

/** A subset of Interaction for use in components. Other properties can be calculated eg in useStepsReducer. */
export type InteractionSpec =
  | AddInteractionSpec
  | SwapInteractionSpec
  | RemoveUniformInteractionSpec
  | RemoveExactBurnInteractionSpec
  | RemoveExactOutputInteractionSpec;
