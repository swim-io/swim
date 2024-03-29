import DecimalJS from "decimal.js";
export class Decimal extends DecimalJS {
  static override isDecimal: (object: any) => object is Decimal;
}

export type Timestamp = number;
