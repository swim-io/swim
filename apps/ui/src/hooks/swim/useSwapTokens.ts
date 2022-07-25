import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { findOrThrow } from "../../utils";

interface SwapTokens {
  readonly fromToken: TokenSpec;
  readonly toToken: TokenSpec;
  readonly fromTokenOptionsIds: readonly string[];
  readonly toTokenOptionsIds: readonly string[];
  readonly setFromTokenId: (fromTokenId: string) => void;
  readonly setToTokenId: (toTokenId: string) => void;
  readonly setFromAndToTokenIds: (fromTokenId: string, toTokenId: string) => void;
  readonly hasUrlError: boolean;
}

const convertTokenIdToUrlParam = (id: string): string => {
  // Assumes token id is {environment}-chain-token in lowercase (doesn't work for LP tokens).
  // TODO: Handle swimUSD's unique id: mainnet-solana-lp-hexapool.
  return id.split("-").slice(1).join("-");
};

const swimUsdRegExp = /-solana-lp-hexapool$/;
// TODO: Make this check more robust
const isSwimUsdPool = (pool: PoolSpec): boolean =>
  [pool.lpToken, ...pool.tokens].some((key) => swimUsdRegExp.test(key));

export const useSwapTokens = (): SwapTokens => {
  const navigate = useNavigate();
  const { env } = useEnvironment();
  const { pools, tokens } = useEnvironment(selectConfig, shallow);
  const { fromEcosystem: fromUrlParam, toEcosystem: toUrlParam } = useParams<{
    readonly fromEcosystem?: string;
    readonly toEcosystem?: string;
  }>();

  const findTokenForParam = (param?: string): TokenSpec | null => {
    if (!url) {
      return undefined;
    }
    const tid = env.toLowerCase() + "-" + url;
    return tokens.find(({ id }) => id === tid);
  };
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

  const maybeFromToken = convertUrlParamToToken(fromUrlParam);
  let hasUrlError = fromUrlParam && !potentialFromToken;

  const fromToken =
    potentialFromToken || tokens.find(({ id }) => id === defaultFromTokenId);

  if (!fromToken) throw new Error("Can't figure out fromToken");

  const toTokenOptionsIds = getOutputTokens(fromToken.id);

  const potentialToToken = convertUrlParamToToken(toUrlParam);
  hasUrlError =
    hasUrlError ||
    ((fromUrlParam &&
      (!potentialToToken ||
        !toTokenOptionsIds.find(
          (id) => id === potentialToToken.id,
        ))) as boolean);

  const toToken =
    potentialToToken && !hasUrlError
      ? potentialToToken
      : tokens.find(({ id }) => id === toTokenOptionsIds[0]);
  if (!toToken) throw new Error("Can't figure out toToken");

  const setFromTokenId = (fromTokenId: string) => {
    const newOutputTokenOptions = getOutputTokens(fromTokenId);
    navigate(
      `/swap/${convertTokenIdToUrlParam(
        fromTokenId,
      )}/to/${convertTokenIdToUrlParam(
        newOutputTokenOptions.find((id) => id === toToken.id)
          ? toToken.id
          : newOutputTokenOptions[0],
      )}`,
    );
  };

  const setToTokenId = (toTokenId: string) => {
    navigate(
      `/swap/${convertTokenIdToUrlParam(
        fromToken.id,
      )}/to/${convertTokenIdToUrlParam(
        toTokenOptionsIds.find((id) => id === toTokenId)
          ? toTokenId
          : toTokenOptionsIds[0],
      )}`,
    );
  };

  const setFromAndToTokens = (fromTokenId: string, toTokenId: string) => {
    const newOutputTokenOptions = getOutputTokens(fromTokenId);
    navigate(
      `/swap/${convertTokenIdToUrlParam(
        fromTokenId,
      )}/to/${convertTokenIdToUrlParam(
        newOutputTokenOptions.find((id) => id === toTokenId)
          ? toTokenId
          : newOutputTokenOptions[0],
      )}`,
    );
  };
  return {
    fromToken,
    toToken,
    fromTokenOptionsIds,
    toTokenOptionsIds,
    setFromTokenId,
    setToTokenId,
    setFromAndToTokens,
    hasUrlError,
  };
};
