import { useCallback, useEffect, useMemo, useState } from "react";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { findOrThrow } from "../../utils";

interface SwapTokens {
  readonly fromToken: TokenSpec;
  readonly toToken: TokenSpec;
  readonly setFromTokenId: (fromTokenId: string) => void;
  readonly setToTokenId: (toTokenId: string) => void;
  readonly fromTokenOptionsIds: readonly string[];
  readonly toTokenOptionsIds: readonly string[];
}

const swimUsdRegExp = /-solana-lp-hexapool$/;
// TODO: Make this check more robust
const isSwimUsdPool = (pool: PoolSpec): boolean =>
  [pool.lpToken, ...pool.tokens].some((key) => swimUsdRegExp.test(key));

export const useSwapTokens = (): SwapTokens => {
  const { pools, tokens } = useEnvironment(selectConfig, shallow);
  const fromTokenOptionsIds = useMemo(
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

  // TODO: Handle swimUSD as a swappable token
  const getOutputTokens = useCallback(
    (fromTokenId: string): readonly string[] => {
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

  const defaultFromTokenId = fromTokenOptionsIds[0];

  const [fromTokenId, setFromTokenId] = useState(defaultFromTokenId);
  const [toTokenId, setToTokenId] = useState(
    () => getOutputTokens(fromTokenId)[0],
  );

  const fromToken =
    tokens.find(({ id }) => id === fromTokenId) ||
    tokens.find(({ id }) => id === defaultFromTokenId);

  if (!fromToken) throw new Error("Can't figure out fromToken");

  const toTokenOptionsIds = getOutputTokens(fromToken.id);

  const toToken =
    (toTokenOptionsIds.includes(toTokenId) &&
      tokens.find(({ id }) => id === toTokenId)) ||
    tokens.find(({ id }) => id === toTokenOptionsIds[0]);

  if (!toToken) throw new Error("Can't figure out toToken");

  useEffect(() => {
    if (fromToken.id !== fromTokenId) {
      setFromTokenId(defaultFromTokenId);
      setToTokenId(getOutputTokens(fromToken.id)[0]);
    }
  }, [defaultFromTokenId, getOutputTokens, fromToken.id, fromTokenId]);

  useEffect(() => {
    if (!toTokenOptionsIds.find((tokenId) => tokenId === toToken.id)) {
      setToTokenId(toTokenOptionsIds[0]);
    }
  }, [toToken.id, toTokenOptionsIds]);

  return {
    fromToken,
    toToken,
    setFromTokenId,
    setToTokenId,
    fromTokenOptionsIds,
    toTokenOptionsIds,
  };
};
