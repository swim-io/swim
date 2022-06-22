import PoolMath from "@swim-io/pool-math";
import Decimal from "decimal.js";

import type { ReadonlyRecord } from "../../utils";

export const MOCK_POOL_MATHS_BY_ID: ReadonlyRecord<string, PoolMath | null> = {
  hexapool: new PoolMath(
    [
      new Decimal(11041106.707843),
      new Decimal(10983453.389835),
      new Decimal(11077807.86164),
      new Decimal(10996725.414836),
      new Decimal(10901971.25562187),
      new Decimal(10999000.39266742),
    ],
    new Decimal(1000),
    new Decimal(0.0003),
    new Decimal(0.0001),
    new Decimal(66000008.28327289),
    new Decimal(1e-8),
  ),
  swimlake: null,
};
