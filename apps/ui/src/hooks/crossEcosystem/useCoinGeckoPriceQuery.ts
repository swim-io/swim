import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

type CoinGeckoResult = ReadonlyRecord<
  string,
  {
    readonly usd: number;
  }
>;

const COINGECKO_ID_TO_TOKEN_IDS: ReadonlyRecord<string, readonly string[]> = {
  "green-satoshi-token": ["mainnet-solana-gst"],
  "green-satoshi-token-bsc": ["mainnet-bnb-gst"],
  stepn: ["mainnet-solana-gmt", "mainnet-bnb-gmt"], // NOTE: These are fungible via a non-Wormhole route
  // The following Token IDs are an ecosystem's nativeTokenSymbol.
  "avalanche-2": ["AVAX"],
  binancecoin: ["BNB"],
  ethereum: ["ETH"],
  fantom: ["FTM"],
  karura: ["KAR"],
  "matic-network": ["MATIC"],
};

export const useCoinGeckoPricesQuery = (): UseQueryResult<
  ReadonlyMap<string, Decimal | null>,
  Error
> => {
  const { env } = useEnvironment();
  return useQuery([env, "coinGeckoPrices"], async () => {
    if (env !== Env.Mainnet) {
      return new Map();
    }
    const coinGeckoIds = Object.keys(COINGECKO_ID_TO_TOKEN_IDS);

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(
      ",",
    )}&vs_currencies=USD`;

    const data = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = (await data.json()) as CoinGeckoResult;

    return new Map(
      coinGeckoIds.flatMap((coinGeckoId) =>
        COINGECKO_ID_TO_TOKEN_IDS[coinGeckoId].map((tokenId) => {
          try {
            const price = new Decimal(result[coinGeckoId].usd);
            return [tokenId, price];
          } catch {
            return [tokenId, null];
          }
        }),
      ),
    );
  });
};
