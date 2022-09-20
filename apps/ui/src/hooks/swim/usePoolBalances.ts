import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type { PoolSpec } from "config";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { isEvmPoolState, isSolanaPool } from "../../models";
import { useSolanaLiquidityQueries } from "../solana";

import { usePoolStateQueries } from "./usePoolStateQueries";

export const usePoolBalances = (poolSpecs: readonly PoolSpec[]) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const poolStateQueries = usePoolStateQueries(poolSpecs);
  const liquidityQueries = useSolanaLiquidityQueries(
    poolSpecs.map((poolSpec) =>
      poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID
        ? [...poolSpec.tokenAccounts.values()]
        : [],
    ),
  );

  return poolSpecs.map((poolSpec, index) => {
    const { data: poolState = null } = poolStateQueries[index];
    if (isEvmPoolState(poolState)) {
      return poolState.balances;
    }
    if (isSolanaPool(poolSpec)) {
      const poolTokens = poolSpec.tokens.map((tokenId) =>
        findOrThrow(tokens, ({ id }) => id === tokenId),
      );
      const { data: allPoolTokenAccounts = null } = liquidityQueries[index];
      if (allPoolTokenAccounts === null) {
        return null;
      }
      return poolTokens.map((tokenConfig, i) => {
        const solanaDetails = getSolanaTokenDetails(tokenConfig);
        const tokenAccount = allPoolTokenAccounts[i];
        if (tokenAccount === null) {
          throw new Error("Missing pool token account");
        }
        return new Decimal(tokenAccount.amount.toString()).div(
          Decimal.pow(10, solanaDetails.decimals),
        );
      });
    }
    return null;
  });
};
