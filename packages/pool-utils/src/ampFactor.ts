import type { Layout } from "@project-serum/borsh";
import { i64, struct } from "@project-serum/borsh";
import type BN from "bn.js";

import type { DecimalBN } from "./decimal";
import { decimal } from "./decimal";

export interface AmpFactor {
  readonly initialValue: DecimalBN;
  readonly initialTs: BN;
  readonly targetValue: DecimalBN;
  readonly targetTs: BN;
}

export const ampFactor = (property = "ampFactor"): Layout<AmpFactor> =>
  struct(
    [
      decimal("initialValue"),
      i64("initialTs"),
      decimal("targetValue"),
      i64("targetTs"),
    ],
    property,
  ) as Layout<AmpFactor>;
