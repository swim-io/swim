import { useMemo } from "react";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useWormholeFromTokenOptionsIds = () => {
  const { pools, tokens } = useEnvironment(selectConfig, shallow);
  const noWrappedTokenIds = tokens
    .filter((token) => token.wrappedDetails.size > 0)
    .map((token) => token.id);
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
        .filter((tokenId) =>
          pools.every(
            (pool) =>
              pool.lpToken !== tokenId && noWrappedTokenIds.includes(tokenId),
          ),
        ),
    [pools],
  );
};
