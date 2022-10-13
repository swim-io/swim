import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";
import type { PoolSpec, TokenConfig } from "config";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { isSolanaPool } from "../../models";
import { useCoinGeckoPricesQuery } from "../crossEcosystem";

import { usePoolBalances } from "./usePoolBalances";

export const usePoolUsdValues = (poolSpecs: readonly PoolSpec[]) => {
  const { tokens } = useEnvironment(selectConfig, shallow);
  const balancesByPool = usePoolBalances(poolSpecs);
  const { data: prices = new Map<TokenConfig["id"], Decimal | null>() } =
    useCoinGeckoPricesQuery();

  return poolSpecs.map((poolSpec, index) => {
    const poolBalances = balancesByPool[index];
    if (poolBalances === null) {
      return new Decimal(0);
    }
    if (isSolanaPool(poolSpec)) {
      const poolTokens = poolSpec.tokens.map((tokenId) =>
        findOrThrow(tokens, ({ id }) => id === tokenId),
      );
      if (
        poolTokens.some(
          (tokenConfig) =>
            !TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].isStablecoin &&
            !TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].isSwimUsd &&
            !prices.get(tokenConfig.id),
        )
      ) {
        return new Decimal(0);
      }
      return poolTokens.reduce((sum, tokenConfig, i) => {
        const price =
          TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].isStablecoin ||
          TOKEN_PROJECTS_BY_ID[tokenConfig.projectId].isSwimUsd
            ? new Decimal(1)
            : prices.get(tokenConfig.id) ?? new Decimal(1);
        return sum.add(poolBalances[i].mul(price));
      }, new Decimal(0));
    }
    return Decimal.sum(...poolBalances);
  });
};
