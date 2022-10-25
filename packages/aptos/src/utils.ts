import { atomicToHuman } from "@swim-io/utils";
import { Decimal } from "decimal.js";

import type { CoinInfoResource } from "./types";

export const getCoinInfoType = (address: string) =>
  `0x1::coin::CoinInfo<${address}>`;

export const getCoinStoreType = (address: string) =>
  `0x1::coin::CoinStore<${address}>`;

export const getCoinInfoSupply = (coinInfo: CoinInfoResource): Decimal => {
  return atomicToHuman(
    new Decimal(coinInfo.data.supply.vec[0].integer.vec[0].value),
    coinInfo.data.decimals,
  );
};
