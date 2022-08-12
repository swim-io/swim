import { findOrThrow } from "@swim-io/utils";
import type { PoolSpec } from "config";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import { u64ToDecimal } from "../../amounts";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { isEvmPoolState, isSolanaPool } from "../../models";
import { useLiquidityQueries } from "../solana";

import { usePoolStateQueries } from "./usePoolStateQueries";

export const usePoolBalances = (poolSpecs: readonly PoolSpec[]) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const poolStateQueries = usePoolStateQueries(poolSpecs);
  const liquidityQueries = useLiquidityQueries(
    poolSpecs.map((poolSpec) =>
      poolSpec.ecosystem === EcosystemId.Solana
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
      return poolTokens.map((tokenSpec, i) => {
        const solanaDetails = getSolanaTokenDetails(tokenSpec);
        return u64ToDecimal(allPoolTokenAccounts[i].amount).div(
          new Decimal(10).pow(solanaDetails.decimals),
        );
      });
    }
    return null;
  });
};
