import type { u64 } from "@solana/spl-token";
import BN from "bn.js";
import Decimal from "decimal.js";

import { fallbackLanguageIfNotSupported, i18next } from "./i18n";

export const atomicToCurrencyString = (
  amount: Decimal,
  options?: Omit<Intl.NumberFormatOptions, "style">,
): string => {
  const language = fallbackLanguageIfNotSupported(
    Intl.NumberFormat,
    i18next.language,
  );
  const numberFormatter = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    ...options,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
  return numberFormatter.format(amount.toNumber());
};

export const atomicToHumanString = (amount: Decimal, decimals = 0): string => {
  const language = fallbackLanguageIfNotSupported(
    Intl.NumberFormat,
    i18next.language,
  );
  const numberFormatter = new Intl.NumberFormat(language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return numberFormatter.format(amount.toNumber());
};

export const atomicToHuman = (amount: Decimal, decimals = 0): Decimal => {
  return decimals === 0 ? amount : amount.div(Decimal.pow(10, decimals));
};

export const atomicToTvlString = (amount: Decimal): string => {
  const language = fallbackLanguageIfNotSupported(
    Intl.NumberFormat,
    i18next.language,
  );
  const numberFormatter = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    ...(amount.toNumber() < 1000
      ? {
          maximumFractionDigits: 0,
        }
      : {
          maximumSignificantDigits: 4,
        }),
  });
  return numberFormatter.format(amount.toNumber());
};

// eslint-disable-next-line import/no-unused-modules
export const humanToAtomic = (amount: Decimal, decimals = 0): Decimal => {
  return amount.mul(Decimal.pow(10, decimals));
};

export const displayAmount = (amount: string, decimals = 0): string => {
  return new Decimal(amount).div(10 ** decimals).toFixed(decimals);
};

/* Like displayAmount but displays as percentage value instead */
export const displayPercentage = (amount: string, decimals = 2): string => {
  const language = fallbackLanguageIfNotSupported(
    Intl.NumberFormat,
    i18next.language,
  );
  const numberFormatter = new Intl.NumberFormat(language, {
    style: "percent",
    minimumFractionDigits: decimals - 2,
    maximumFractionDigits: decimals - 2,
  });
  return numberFormatter.format(
    new Decimal(amount).div(10 ** decimals).toNumber(),
  );
};

// eslint-disable-next-line import/no-unused-modules
export const decimalToBN = (decimal: Decimal): BN => new BN(decimal.toFixed(0));
export const BNtoDecimal = (bn: BN): Decimal => new Decimal(bn.toString());

export const u64ToDecimal = (number: u64): Decimal =>
  new Decimal(number.toString());
