import PoolMath from "@swim-io/pool-math";
import Decimal from "decimal.js";

import type { SwimPool } from "./hexapool";

export const createPoolMath = (swimPool: SwimPool): PoolMath =>
  new PoolMath(
    swimPool.numberOfTokens,
    new Decimal(swimPool.ampFactor.targetValue.value.toString()),
    new Decimal(swimPool.lpFee).div(
      Decimal.pow(10, swimPool.lpDecimalEqualizer),
    ),
    new Decimal(swimPool.governanceFee).div(
      Decimal.pow(10, swimPool.lpDecimalEqualizer),
    ),
  );
