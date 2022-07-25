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
  readonly setFromToken: (fromTokenParam: TokenSpec) => void;
  readonly setToToken: (toTokenParam: TokenSpec) => void;
  readonly setFromAndToTokens: (
    fromTokenParam: TokenSpec,
    toTokenParam: TokenSpec,
  ) => void;
  readonly hasUrlError: boolean;
}

const convertTokenSpecToUrlParam = (token: TokenSpec): string => {
  return token.nativeEcosystem + "-" + token.project.symbol;
};

const swimUsdRegExp = /-solana-lp-hexapool$/;
// TODO: Make this check more robust
const isSwimUsdPool = (pool: PoolSpec): boolean =>
  [pool.lpToken, ...pool.tokens].some((key) => swimUsdRegExp.test(key));

export const useSwapTokens = (): SwapTokens => {
  const navigate = useNavigate();
  const { env } = useEnvironment();
  const { pools, tokens } = useEnvironment(selectConfig, shallow);
  const { fromToken: fromUrlParam, toToken: toUrlParam } = useParams<{
    readonly fromToken?: string;
    readonly toToken?: string;
  }>();

  const findTokenForParam = (param?: string): TokenSpec | null => {
    if (!param) {
      return null;
    }
    const tid = env.toLowerCase() + "-" + param.toLowerCase();
    return tokens.find(({ id }) => id === tid) ?? null;
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

  const maybeFromToken = findTokenForParam(fromUrlParam);
  const hasFromUrlError = (fromUrlParam && !maybeFromToken) as boolean;

  const fromToken =
    maybeFromToken ??
    findOrThrow(tokens, ({ id }) => id === defaultFromTokenId);

  const toTokenOptionsIds = getOutputTokens(fromToken.id);

  const maybeToToken = findTokenForParam(toUrlParam);
  const hasToUrlError =
    hasFromUrlError ||
    ((fromUrlParam &&
      (!maybeToToken ||
        !toTokenOptionsIds.find((id) => id === maybeToToken.id))) as boolean);

  const toToken =
    maybeToToken && !hasToUrlError
      ? maybeToToken
      : findOrThrow(tokens, ({ id }) => id === toTokenOptionsIds[0]);

  const setFromToken = (fromTokenArg: TokenSpec) => {
    setFromAndToTokens(fromTokenArg, toToken);
  };

  const setToToken = (toTokenArg: TokenSpec) => {
    setFromAndToTokens(fromToken, toTokenArg);
  };

  const setFromAndToTokens = (
    fromTokenArg: TokenSpec,
    toTokenArg: TokenSpec,
  ) => {
    const fromTokenUrlParam = convertTokenSpecToUrlParam(fromTokenArg);
    const newOutputTokenOptions = getOutputTokens(fromTokenArg.id);
    const toTokenUrlParam = convertTokenSpecToUrlParam(
      newOutputTokenOptions.find((id) => id === toTokenArg.id)
        ? toTokenArg
        : findOrThrow(tokens, ({ id }) => id === newOutputTokenOptions[0]),
    );
    navigate(`/swap/${fromTokenUrlParam}/to/${toTokenUrlParam}`);
  };
  const hasUrlError = hasToUrlError || hasFromUrlError;
  return {
    fromToken,
    toToken,
    fromTokenOptionsIds,
    toTokenOptionsIds,
    setFromToken,
    setToToken,
    setFromAndToTokens,
    hasUrlError,
  };
};
