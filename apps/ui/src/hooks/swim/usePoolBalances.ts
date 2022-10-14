import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow, isEachNotNull } from "@swim-io/utils";
import type { PoolSpec } from "config";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { isEvmPoolState, isSolanaPool } from "../../models";
import { useSolanaTokenAccountQueries } from "../solana";

import { usePoolStateQueries } from "./usePoolStateQueries";

export const usePoolBalances = (poolSpecs: readonly PoolSpec[]) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const poolStateQueries = usePoolStateQueries(poolSpecs);
  const liquidityQueries = useSolanaTokenAccountQueries(
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
      const { data: poolTokenAccounts = null } = liquidityQueries[index];
      if (poolTokenAccounts === null || !isEachNotNull(poolTokenAccounts)) {
        return null;
      }
      return poolTokens.map((tokenConfig, i) => {
        const solanaDetails = getSolanaTokenDetails(tokenConfig);
        const tokenAccount = poolTokenAccounts[i];
        return new Decimal(tokenAccount.amount.toString()).div(
          Decimal.pow(10, solanaDetails.decimals),
        );
      });
    }
    return null;
  });
};
