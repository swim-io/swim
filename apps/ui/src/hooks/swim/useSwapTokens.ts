import { useCallback, useEffect, useMemo, useState } from "react";

import type { PoolSpec, TokenSpec } from "../../config";
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
  [pool.lpToken, ...pool.tokenAccounts.keys()].some((key) =>
    swimUsdRegExp.test(key),
  );

export const useSwapTokens = (
  pools: readonly PoolSpec[],
  tokens: readonly TokenSpec[],
): SwapTokens => {
  const fromTokenOptionsIds = useMemo(
    () =>
      pools
        .filter((pool) => !pool.isStakingPool)
        .flatMap((pool) => [...pool.tokenAccounts.keys()])
        // TODO: Remove this if we want to support swimUSD swaps
        .filter((tokenId) => pools.every((pool) => pool.lpToken !== tokenId)),
    [pools],
  );

  // TODO: Handle swimUSD as a swappable token
  const getOutputTokens = useCallback(
    (fromTokenId: string): readonly string[] => {
      const inputPool = findOrThrow(pools, (pool) =>
        pool.tokenAccounts.has(fromTokenId),
      );
      const connectedTokens = isSwimUsdPool(inputPool)
        ? pools
            .filter(isSwimUsdPool)
            .flatMap((pool) => [...pool.tokenAccounts.keys()])
        : [...inputPool.tokenAccounts.keys()];
      return connectedTokens.filter(
        (tokenId) => tokenId !== fromTokenId && !swimUsdRegExp.test(tokenId),
      );
    },
    [pools],
  );

  const getDefaultFromTokenId = useCallback(
    () => fromTokenOptionsIds[0],
    [fromTokenOptionsIds],
  );

  const [fromTokenId, setFromTokenId] = useState(getDefaultFromTokenId);
  const [toTokenId, setToTokenId] = useState(
    () => getOutputTokens(fromTokenId)[0],
  );

  const fromToken =
    tokens.find(({ id }) => id === fromTokenId) ||
    tokens.find(({ id }) => id === getDefaultFromTokenId());

  if (!fromToken) throw new Error("Can't figure out fromToken");

  const toTokenOptionsIds = getOutputTokens(fromToken.id);

  const toToken =
    (toTokenOptionsIds.includes(toTokenId) &&
      tokens.find(({ id }) => id === toTokenId)) ||
    tokens.find(({ id }) => id === toTokenOptionsIds[0]);

  if (!toToken) throw new Error("Can't figure out toToken");

  useEffect(() => {
    if (fromToken.id !== fromTokenId) {
      setFromTokenId(getDefaultFromTokenId());
      setToTokenId(getOutputTokens(fromToken.id)[0]);
    }
  }, [getDefaultFromTokenId, getOutputTokens, fromToken.id, fromTokenId]);

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
