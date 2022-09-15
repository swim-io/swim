import Decimal from "decimal.js";

export const atomicToHuman = (amount: Decimal, decimals: number): Decimal => {
  return amount.div(Decimal.pow(10, decimals));
};

export const humanToAtomic = (amount: Decimal, decimals: number): Decimal => {
  return amount.mul(Decimal.pow(10, decimals));
};
