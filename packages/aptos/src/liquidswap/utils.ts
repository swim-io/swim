import { isSortedSymbols } from "@pontem/liquidswap-sdk/dist/tsc/utils/contracts.js";
import type { PoolState, TokenDetails } from "@swim-io/core";
import { atomicToHuman } from "@swim-io/utils";
import { Decimal } from "decimal.js";

import type { PoolResource } from "./types";

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
