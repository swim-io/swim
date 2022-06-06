import BN from "bn.js";

import type {DecimalBN as DecimalBorsh } from "./from_ui/decimal";

import { Decimal, Timestamp } from "./common";
import {
  POOL_DECIMAL_MAX_BITS,
  POOL_DECIMAL_MAX_DECIMALS,
  POOL_FEE_DECIMALS,
} from "./constants";

const POOL_FEE_DECIMAL_SHIFT = new Decimal(10).pow(POOL_FEE_DECIMALS);

export namespace FromPool {
  export function time(bn: BN): Timestamp {
    return bn.toNumber();
  }

  export function decimal(poolDecimal: DecimalBorsh): Decimal {
    return new Decimal(poolDecimal.value.toString()).div(new Decimal(10).pow(poolDecimal.decimals));
  }

  export function fee(fee: number): Decimal {
    //technical debt in how fees are stored in the pool state
    return new Decimal(fee).div(POOL_FEE_DECIMAL_SHIFT);
  }
}

export namespace ToPool {
  export function time(ts: Timestamp) : BN {
    return new BN(ts);
  }

  export function decimal(decVal: Decimal): DecimalBorsh {
    if (decVal.isNegative())
      throw new Error(`value must be positive ${decVal}`);

    const decimals = decVal.decimalPlaces();
    const value = new BN(decVal.mul(new Decimal(10).pow(decimals)).toString());

    if (decimals > POOL_DECIMAL_MAX_DECIMALS || value.bitLength() > POOL_DECIMAL_MAX_BITS)
      throw new Error(`Can't convert ${decimal} to pool U64 type`);

    return {value, decimals};
  }

  export function tokenValue(decVal: Decimal, decimals: number): BN {
    if (decVal.isNegative())
      throw new Error(`value must be positive ${decVal}`);

    const value = new BN(decVal.mul(new Decimal(10).pow(decimals)).round().toString());

    if (value.bitLength() > 64)
      throw new Error(`must fit in 64 bits ${value}`);

    return value;
  }

  //this converts to DecimalBorsh rather than number because that's what the init and fee change
  // instructions expect
  export function fee(decVal: Decimal): DecimalBorsh {
    const decimals = decVal.decimalPlaces();
    if (decVal.gte(1) || decVal.isNegative() || decimals > POOL_FEE_DECIMALS)
      throw new Error(`Can't convert ${decimal} to PoolFee type`);

    const value = new BN(decVal.mul(new Decimal(10).pow(decimals)).toString());

    return {value, decimals};
  }
}
