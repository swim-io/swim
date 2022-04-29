import type { u64 } from "@solana/spl-token";
import BN from "bn.js";
import Decimal from "decimal.js";

import { defaultIfError } from "./utils";

export const atomicToHumanString = (amount: Decimal, decimals = 0): string => {
  return amount.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

export const atomicToHuman = (amount: Decimal, decimals = 0): Decimal => {
  return decimals === 0 ? amount : amount.div(Decimal.pow(10, decimals));
};

export const humanToAtomic = (amount: Decimal, decimals = 0): Decimal => {
  return amount.mul(Decimal.pow(10, decimals));
};

export const displayAmount = (amount: string, decimals = 0): string =>
  amount === "0"
    ? "0"
    : amount.length <= decimals
    ? `0.${"0".repeat(decimals - amount.length)}${amount}`
    : `${amount.slice(0, -decimals)}.${amount.slice(-decimals)}`;

/* Like displayAmount but displays as percentage value instead */
export const displayPercentage = (amount: string, decimals = 0): string =>
  amount.length <= decimals - 2
    ? `0.${"0".repeat(decimals - amount.length - 2)}${amount}%`
    : `${amount.slice(0, -(decimals - 2))}.${amount.slice(-(decimals - 2))}%`;

const buildAmountRegExp = (decimals: number): RegExp =>
  decimals === 0
    ? new RegExp(`^(?<big>(?:[1-9][0-9]*|0))$`)
    : new RegExp(
        `^(?<big>(?:[1-9][0-9]*|0))(\\.(?<small>[0-9]{1,${decimals}}))?$`,
      );

export const parseAmount = (amount: string, decimals = 0): string => {
  if (amount.match(/^0+$/)) {
    return "0";
  }
  const amountRegExp = buildAmountRegExp(decimals);
  const matches = amount.match(amountRegExp);
  if (!matches || !matches.groups) {
    throw new Error("Invalid amount");
  }
  const { big = "", small = "" } = matches.groups;
  return decimals === 0
    ? big
    : `${big === "0" ? "" : big}${small}${"0".repeat(decimals - small.length)}`;
};

export const parseToDecimalOrThrow = (amount: string, decimals = 0): Decimal =>
  new Decimal(parseAmount(amount, decimals));

export const parseToDecimal = (amount: string, decimals = 0): Decimal | null =>
  defaultIfError(() => parseToDecimalOrThrow(amount, decimals), null);

export const decimalToBN = (decimal: Decimal): BN => new BN(decimal.toFixed(0));
export const BNtoDecimal = (bn: BN): Decimal => new Decimal(bn.toString());

export const u64ToDecimal = (number: u64): Decimal =>
  new Decimal(number.toString());

export const sumToDecimal = (amounts: readonly Decimal.Value[]): Decimal =>
  amounts.reduce(
    (sum: Decimal, amount: Decimal.Value): Decimal => sum.add(amount),
    new Decimal(0),
  );

export const decimalRemoveTrailingZero = (decimal: Decimal): string =>
  decimal.toString().replace(/^(\d+\.\d*?[1-9])0+$/, "$1");
