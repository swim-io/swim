import type { Buffer } from "buffer";

import type { Layout } from "@project-serum/borsh";
import {
  array,
  bool,
  i64,
  publicKey,
  struct,
  u128,
  u32,
  u64,
  u8,
} from "@project-serum/borsh";
import type { SwimPoolState } from "@swim-io/solana";
import { ampFactor } from "@swim-io/solana";

type U8 = (property?: string) => Layout<number>;

const swimPool = (
  numberOfTokens: number,
  property = "swimPool",
): Layout<SwimPoolState> =>
  struct(
    [
      u64("key"),
      u8("nonce"),
      bool("isPaused"),
      ampFactor(),
      u32("lpFee"),
      u32("governanceFee"),
      publicKey("lpMintKey"),
      u8("lpDecimalEqualizer"),
      array(publicKey(), numberOfTokens, "tokenMintKeys"),
      array((u8 as U8)(), numberOfTokens, "tokenDecimalEqualizers"),
      array(publicKey(), numberOfTokens, "tokenKeys"),
      publicKey("pauseKey"),
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

export const deserializeSwimPoolV2 = (
  numberOfTokens: number,
  poolData: Buffer,
): SwimPoolState => {
  const layout = swimPool(numberOfTokens);
  if (poolData.length !== layout.span) {
    throw new Error("Incorrect pool data length v2");
  }
  return layout.decode(poolData);
};
