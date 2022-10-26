import type { PoolState, TokenDetails } from "@swim-io/core";
import { atomicToHuman } from "@swim-io/utils";
import type { Types } from "aptos";
import { Decimal } from "decimal.js";

import type {
  AddLiquidityPayloadParams,
  LiquidSwapPoolInfo,
  PoolResource,
} from "./types";

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

export const parsePoolAddress = (address: string): LiquidSwapPoolInfo => {
  const match = address.match(
    /^(?<liquidswapAccountAddress>0x[0-9A-Fa-f]+)::liquidity_pool::LiquidityPool<(?<coinXType>0x.+),\s?(?<coinYType>0x.+),\s?(?<curveType>0x.+)>$/,
  );
  if (!match || !match.groups)
    throw new Error(
      `address ${address} does not match a liquidswap pool address`,
    );

  const { liquidswapAccountAddress, coinXType, coinYType, curveType } =
    match.groups;

  return { liquidswapAccountAddress, coinXType, coinYType, curveType };
};

export const getAddLiquidityTransactionPayload = ({
  poolAddress,
  coinXAmountAtomic,
  coinYAmountAtomic,
}: AddLiquidityPayloadParams): Types.TransactionPayload => {
  const { liquidswapAccountAddress, coinXType, coinYType, curveType } =
    parsePoolAddress(poolAddress);

  return {
    type: "entry_function_payload",
    function: `${liquidswapAccountAddress}::scripts_v2::add_liquidity`,
    type_arguments: [coinXType, coinYType, curveType],
    // https://github.com/pontem-network/liquidswap/blob/b89aed9adb96c0b083134765f75be814418be670/liquidswap_router_v2/sources/scripts_v2.move#L50-L53
    // [coin_x_val: u64, coin_x_val_min: u64, coin_y_val: u64, coin_y_val_min: u64]
    // I think that in practice the `_min` values cause this check https://github.com/pontem-network/liquidswap/blob/b89aed9adb96c0b083134765f75be814418be670/liquidswap_router_v2/sources/router_v2.move#L67-L68
    // to fail due to rounding issues. Thus set them to zero for now. In theory `coin::withdraw` throws if the amount is not enough anyways. See https://github.com/aptos-labs/aptos-core/blob/60b88149cb7e7ae494b08916781dffaddfca766b/aptos-move/framework/aptos-framework/sources/coin.move#L269
    // TODO aptos verify somehow, ask pontem?
    arguments: [coinXAmountAtomic, "0", coinYAmountAtomic, "0"],
  };
};
