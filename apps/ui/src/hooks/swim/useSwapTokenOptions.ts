import { findOrThrow } from "@swim-io/utils";
import { useCallback, useMemo } from "react";
import shallow from "zustand/shallow.js";

import type { PoolSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useFromTokenOptionsIds = () => {
  const { pools } = useEnvironment(selectConfig, shallow);
  return useMemo(
    () =>
      pools
        .filter((pool) => !pool.isStakingPool && !pool.isDisabled)
        .flatMap((pool) => pool.tokens)
        // Remove duplicated tokenId
        .filter(
          (tokenId, index, tokenIds) => tokenIds.indexOf(tokenId) === index,
        )
        // TODO: Remove this if we want to support swimUSD swaps
        .filter((tokenId) => pools.every((pool) => pool.lpToken !== tokenId)),
    [pools],
  );
};

// TODO: Handle swimUSD as a swappable token
export const useToTokenOptionsIds = () => {
  const { pools } = useEnvironment(selectConfig, shallow);
  return useCallback(
    (fromTokenId: string): readonly string[] => {
      const swimUsdRegExp = /-solana-lp-hexapool$/;
      // TODO: Make this check more robust
      const isSwimUsdPool = (pool: PoolSpec): boolean =>
        [pool.lpToken, ...pool.tokens].some((key) => swimUsdRegExp.test(key));
      const inputPool = findOrThrow(pools, (pool) =>
        pool.tokens.includes(fromTokenId),
      );
      const connectedTokens = isSwimUsdPool(inputPool)
        ? pools.filter(isSwimUsdPool).flatMap((pool) => pool.tokens)
        : inputPool.tokens;
      return connectedTokens.filter(
        (tokenId) => tokenId !== fromTokenId && !swimUsdRegExp.test(tokenId),
      );
    },
    [pools],
  );
};
