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
import type { Layout } from "@project-serum/borsh";
import type { SolanaEcosystemId, SolanaPoolState } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, ampFactor } from "@swim-io/solana";

type U8 = (property?: string) => Layout<number>;

export interface LegacySolanaPoolState
  extends Omit<
    SolanaPoolState,
    | "governanceFee"
    | "lpFee"
    | "pauseKey"
    | "preparedGovernanceFee"
    | "preparedLpFee"
  > {
  readonly governanceFee: number;
  readonly lpFee: number;
  readonly preparedGovernanceFee: number;
  readonly preparedLpFee: number;
  readonly ecosystem: SolanaEcosystemId;
}

export const solanaPool = (
  numberOfTokens: number,
  property = "solanaPool",
): Layout<Omit<LegacySolanaPoolState, "ecosystem">> =>
  struct(
    [
      u8("bump"),
      bool("isPaused"),
      ampFactor(),
      u32("lpFee"),
      u32("governanceFee"),
      publicKey("lpMintKey"),
      u8("lpDecimalEqualizer"),
      array(publicKey(), numberOfTokens, "tokenMintKeys"),
      array((u8 as U8)(), numberOfTokens, "tokenDecimalEqualizers"),
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

export const deserializeLegacySolanaPoolState = (
  numberOfTokens: number,
  accountData: Buffer,
): LegacySolanaPoolState => {
  const layout = solanaPool(numberOfTokens);
  if (accountData.length !== layout.span) {
    throw new Error("Incorrect account data length");
  }
  const decoded = layout.decode(accountData);
  return {
    ...decoded,
    ecosystem: SOLANA_ECOSYSTEM_ID,
  };
};
