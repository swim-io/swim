import type { Layout } from "@project-serum/borsh";
import { struct, u64, u8 } from "@project-serum/borsh";
import type BN from "bn.js";

export interface DecimalBN {
  readonly value: BN;
  readonly decimals: number;
}

export const decimal = (property = "decimal"): Layout<DecimalBN> =>
  struct([u64("value"), u8("decimals")], property);
