import { atomicToHuman } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { DecimalBN } from "../serialization";

export const decimalBnToHuman = (decimalBn: DecimalBN): Decimal =>
  atomicToHuman(new Decimal(decimalBn.value.toString()), decimalBn.decimals);

export const atomicNumberToHuman = (
  atomicNumber: number,
  decimals: number,
): Decimal => atomicToHuman(new Decimal(atomicNumber.toString()), decimals);
