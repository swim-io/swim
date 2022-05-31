import BN from "bn.js";
import type { DecimalBN as DecimalBorsh } from "./from_ui/decimal";
import { Decimal, Timestamp } from "./common";
export declare namespace FromPool {
    function time(bn: BN): Timestamp;
    function decimal(poolDecimal: DecimalBorsh): Decimal;
    function fee(fee: number): Decimal;
}
export declare namespace ToPool {
    function time(ts: Timestamp): BN;
    function decimal(decVal: Decimal): DecimalBorsh;
    function tokenValue(decVal: Decimal, decimals: number): BN;
    function fee(decVal: Decimal): DecimalBorsh;
}
