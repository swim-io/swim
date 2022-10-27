import type { Buffer } from "buffer";

import { BorshAccountsCoder } from "@project-serum/anchor";
import type { PublicKey } from "@solana/web3.js";
import { idl } from "@swim-io/solana-contracts";
import type BN from "bn.js";

import type { AmpFactor } from "./ampFactor";

export type Timestamp = BN;

export interface NumberValue {
  readonly value: number;
}

export interface SolanaPoolConstantState {
  readonly bump: number;
  readonly lpMintKey: PublicKey;
  readonly lpDecimalEqualizer: number;
  readonly tokenMintKeys: readonly PublicKey[];
  readonly tokenDecimalEqualizers: readonly number[];
  readonly tokenKeys: readonly PublicKey[];
}

export interface SolanaPoolMutableState {
  readonly isPaused: boolean;
  readonly ampFactor: AmpFactor;
  readonly lpFee: NumberValue;
  readonly governanceFee: NumberValue;
  readonly governanceKey: PublicKey;
  readonly governanceFeeKey: PublicKey;
  readonly pauseKey: PublicKey;
  readonly preparedGovernanceKey: PublicKey;
  readonly governanceTransitionTs: Timestamp;
  readonly preparedLpFee: NumberValue;
  readonly preparedGovernanceFee: NumberValue;
  readonly feeTransitionTs: Timestamp;
  readonly previousDepth: BN;
}

export interface SolanaPoolState
  extends SolanaPoolConstantState,
    SolanaPoolMutableState {}

const TWO_POOL_ACCOUNT_NAME = "TwoPool";

export const deserializeSolanaPoolState = (
  accountData: Buffer,
): SolanaPoolState => {
  const twoPoolDiscriminator = BorshAccountsCoder.accountDiscriminator(
    TWO_POOL_ACCOUNT_NAME,
  );
  if (twoPoolDiscriminator.compare(accountData.subarray(0, 8)) !== 0) {
    throw new Error("Invalid account data");
  }
  const decoder = new BorshAccountsCoder(idl.twoPool);
  return decoder.decode<SolanaPoolState>(TWO_POOL_ACCOUNT_NAME, accountData);
};
