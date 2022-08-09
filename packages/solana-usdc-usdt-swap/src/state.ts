import type { Connection, PublicKey } from "@solana/web3.js";
import type { SwimPoolState } from "@swim-io/solana-types";
import { deserializeSwimPool } from "@swim-io/solana-types";
import Decimal from "decimal.js";

import type { SwimPoolConstantProperties } from "./hexapool";
import { hexapool } from "./hexapool";

interface SwimPoolBalances {
  readonly tokenBalances: readonly Decimal[];
}

export type SwimPool = SwimPoolConstantProperties &
  SwimPoolState &
  SwimPoolBalances;

const fetchTokenBalances = async (
  solanaConnection: Connection,
  tokenKeys: readonly PublicKey[],
): Promise<readonly Decimal[]> => {
  const responses = await Promise.all(
    tokenKeys.map((tokenKey) =>
      solanaConnection.getTokenAccountBalance(tokenKey),
    ),
  );
  const tokenAmounts = responses.map((response) => response.value);
  return tokenAmounts.map((tokenAmount) =>
    new Decimal(tokenAmount.amount).div(Decimal.pow(10, tokenAmount.decimals)),
  );
};

export const fetchSwimPool = async (
  solanaConnection: Connection,
): Promise<SwimPool> => {
  const accountInfo = await solanaConnection.getAccountInfo(hexapool.stateKey);
  if (accountInfo === null) {
    throw new Error("Could not retrieve account info");
  }
  const poolState = deserializeSwimPool(
    hexapool.numberOfTokens,
    accountInfo.data,
  );
  const tokenBalances = await fetchTokenBalances(
    solanaConnection,
    hexapool.tokenKeys,
  );
  return {
    ...hexapool,
    ...poolState,
    tokenBalances,
  };
};
