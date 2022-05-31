import DecimalJS from "decimal.js";
export declare class Decimal extends DecimalJS {
    static isDecimal: (object: any) => object is Decimal;
}
export declare type Timestamp = number;
