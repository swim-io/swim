import type { Layout } from "@project-serum/borsh";
import {
  array,
  bool,
  i64,
  publicKey,
  struct,
  u128,
  u32,
  u8,
} from "@project-serum/borsh";
import type { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

import type { AmpFactor } from "./ampFactor";
import { ampFactor } from "./ampFactor";

export interface SwimPoolState {
  readonly nonce: number;
  readonly isPaused: boolean;
  readonly ampFactor: AmpFactor;
  readonly lpFee: number;
  readonly governanceFee: number;
  readonly lpMintKey: PublicKey;
  readonly lpDecimalEqualizer: number;
  readonly tokenMintKeys: readonly PublicKey[];
  readonly tokenDecimalEqualizers: readonly number[];
  readonly tokenKeys: readonly PublicKey[];
  readonly governanceKey: PublicKey;
  readonly governanceFeeKey: PublicKey;
  readonly preparedGovernanceKey: PublicKey;
  readonly governanceTransitionTs: BN;
  readonly preparedLpFee: number;
  readonly preparedGovernanceFee: number;
  readonly feeTransitionTs: BN;
  readonly previousDepth: BN;
}

export const swimPool = (
  numberOfTokens: number,
  property = "swimPool",
): Layout<SwimPoolState> =>
  struct(
    [
      u8("nonce"),
      bool("isPaused"),
      ampFactor(),
      u32("lpFee"),
      u32("governanceFee"),
      publicKey("lpMintKey"),
      u8("lpDecimalEqualizer"),
      array(publicKey(), numberOfTokens, "tokenMintKeys"),
      array(u8(), numberOfTokens, "tokenDecimalEqualizers"),
      array(publicKey(), numberOfTokens, "tokenKeys"),
      publicKey("governanceKey"),
      publicKey("governanceFeeKey"),
      publicKey("preparedGovernanceKey"),
      i64("governanceTransitionTs"),
      u32("preparedLpFee"),
      u32("preparedGovernanceFee"),
      i64("feeTransitionTs"),
      u128("previousDepth"),
    ],
    property,
  );

export const deserializeSwimPool = (
  numberOfTokens: number,
  poolData: Buffer,
): SwimPoolState => {
  const layout = swimPool(numberOfTokens);
  if (poolData.length !== layout.span) {
    throw new Error("Incorrect pool data length");
  }
  return layout.decode(poolData);
};
