import type { Buffer } from "buffer";

import type { BN, Idl } from "@project-serum/anchor";
import { BorshAccountsCoder } from "@project-serum/anchor";
import type { PublicKey } from "@solana/web3.js";
import type { AmpFactor, SwimPoolState } from "@swim-io/solana";
import { idl } from "@swim-io/solana-contracts";

type Value = {
  readonly value: number;
};

type TwoPoolState = {
  readonly nonce: number;
  readonly lpMintKey: PublicKey;
  readonly lpDecimalEqualizer: number;
  readonly tokenMintKeys: readonly PublicKey[];
  readonly tokenDecimalEqualizers: readonly number[];
  readonly tokenKeys: readonly PublicKey[];
  readonly isPaused: boolean;
  readonly ampFactor: AmpFactor;
  readonly lpFee: Value;
  readonly governanceFee: Value;
  readonly governanceKey: PublicKey;
  readonly governanceFeeKey: PublicKey;
  readonly preparedGovernanceKey: PublicKey;
  readonly governanceTransitionTs: BN;
  readonly preparedLpFee: Value;
  readonly preparedGovernanceFee: Value;
  readonly feeTransitionTs: BN;
  readonly previousDepth: BN;
};

export const deserializeSwimPoolV2 = (poolData: Buffer): SwimPoolState => {
  const PoolDecoder = new BorshAccountsCoder(idl.twoPool as Idl);
  const poolState: TwoPoolState = PoolDecoder.decode("TwoPool", poolData);
  return {
    nonce: poolState.nonce,
    isPaused: poolState.isPaused,
    ampFactor: poolState.ampFactor,
    lpFee: poolState.lpFee.value,
    governanceFee: poolState.governanceFee.value,
    lpMintKey: poolState.lpMintKey,
    lpDecimalEqualizer: poolState.lpDecimalEqualizer,
    tokenMintKeys: poolState.tokenMintKeys,
    tokenDecimalEqualizers: poolState.tokenDecimalEqualizers,
    tokenKeys: poolState.tokenKeys,
    governanceKey: poolState.governanceKey,
    governanceFeeKey: poolState.governanceFeeKey,
    preparedGovernanceKey: poolState.preparedGovernanceKey,
    governanceTransitionTs: poolState.governanceTransitionTs,
    preparedLpFee: poolState.preparedLpFee.value,
    preparedGovernanceFee: poolState.preparedGovernanceFee.value,
    feeTransitionTs: poolState.feeTransitionTs,
    previousDepth: poolState.previousDepth,
  };
};
