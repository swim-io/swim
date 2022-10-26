import type { PoolState, TokenDetails } from "@swim-io/core";
import { atomicToHuman } from "@swim-io/utils";
import { Decimal } from "decimal.js";

import type { PoolResource } from "./types";

const EQUAL = 0;
const LESS_THAN = 1;
const GREATER_THAN = 2;

function cmp(a: number, b: number) {
  if (a === b) {
    return EQUAL;
  } else if (a < b) {
    return LESS_THAN;
  } else {
    return GREATER_THAN;
  }
}

function compare(symbolX: string, symbolY: string) {
  const lenCmp = cmp(symbolX.length, symbolY.length);
  if (lenCmp != EQUAL) {
    return lenCmp;
  }
  let i = 0;
  while (i < symbolX.length && i < symbolY.length) {
    const elem_cmp = cmp(symbolX.charCodeAt(i), symbolY.charCodeAt(i));
    if (elem_cmp != EQUAL) return elem_cmp;
    i++;
  }
  return EQUAL;
}

// Their fixed isSortedSymbols is not published yet...
// https://github.com/pontem-network/liquidswap-sdk/commit/bc3b715de2556e325bf3d5dfeffa65cd1a59ebfb
export function isSortedSymbols(symbolX: string, symbolY: string) {
  return compare(symbolX, symbolY) === LESS_THAN;
}

export const getPoolBalances = (
  pool: PoolResource,
  tokens: readonly [TokenDetails, TokenDetails],
): PoolState["balances"] => {
  const reserves = [
    pool.data.coin_x_reserve.value,
    pool.data.coin_y_reserve.value,
  ];
  const atomicBalances = isSortedSymbols(tokens[0].address, tokens[1].address)
    ? reserves
    : [...reserves].reverse();

  return [
    atomicToHuman(new Decimal(atomicBalances[0]), tokens[0].decimals),
    atomicToHuman(new Decimal(atomicBalances[1]), tokens[1].decimals),
  ];
};
