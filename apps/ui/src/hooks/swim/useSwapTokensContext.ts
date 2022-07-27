import { findOrThrow } from "@swim-io/utils";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { useFromTokenOptionsIds } from "./useSwapTokenOptions";

interface SwapTokensContext {
  readonly fromToken: TokenSpec;
  readonly toToken: TokenSpec;
  readonly fromTokenOptionsIds: readonly string[];
  readonly toTokenOptionsIds: readonly string[];
  readonly setFromToken: (newFromToken: TokenSpec) => void;
  readonly setToToken: (newToToken: TokenSpec) => void;
  readonly setFromAndToTokens: (
    newFromToken: TokenSpec,
    newToToken: TokenSpec,
  ) => void;
  readonly hasUrlError: boolean;
}

const convertTokenSpecToUrlParam = (token: TokenSpec): string =>
  `${token.nativeEcosystem}-${token.project.symbol}`.toLowerCase();

const swimUsdRegExp = /-solana-lp-hexapool$/;
// TODO: Make this check more robust
const isSwimUsdPool = (pool: PoolSpec): boolean =>
  [pool.lpToken, ...pool.tokens].some((key) => swimUsdRegExp.test(key));

export const useSwapTokensContext = (): SwapTokensContext => {
  const navigate = useNavigate();
  const { pools, tokens } = useEnvironment(selectConfig, shallow);
  const { fromToken: fromUrlParam, toToken: toUrlParam } = useParams<{
    readonly fromToken?: string;
    readonly toToken?: string;
  }>();

  const findTokenForParam = (param?: string): TokenSpec | null => {
    if (!param) {
      return null;
    }
    const [ecosystemId, projectSymbol] = param.split("-");
    return (
      tokens.find((token) => {
        return (
          token.project.symbol.toLowerCase() === projectSymbol &&
          token.nativeEcosystem.toLowerCase() === ecosystemId
        );
      }) ?? null
    );
  };
  const fromTokenOptionsIds = useFromTokenOptionsIds();

  // TODO: Handle swimUSD as a swappable token
  const getToTokenOptionsIds = useCallback(
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

  const toTokenOptionsIds = getToTokenOptionsIds(fromToken.id);

  const maybeToToken = findTokenForParam(toUrlParam);
  const hasToUrlError =
    !maybeToToken || !toTokenOptionsIds.find((id) => id === maybeToToken.id);

  const toToken =
    maybeToToken && !hasToUrlError
      ? maybeToToken
      : findOrThrow(tokens, ({ id }) => id === toTokenOptionsIds[0]);

  const setFromAndToTokens = (
    newFromToken: TokenSpec,
    newToToken: TokenSpec,
  ) => {
    const fromTokenUrlParam = convertTokenSpecToUrlParam(newFromToken);
    const newToTokenOptions = getToTokenOptionsIds(newFromToken.id);
    const toTokenUrlParam = convertTokenSpecToUrlParam(
      newToTokenOptions.find((id) => id === newToToken.id)
        ? newToToken
        : findOrThrow(tokens, ({ id }) => id === newToTokenOptions[0]),
    );
    navigate(`/swap/${fromTokenUrlParam}/to/${toTokenUrlParam}`);
  };

  const setFromToken = (newFromToken: TokenSpec) => {
    setFromAndToTokens(newFromToken, toToken);
  };

  const setToToken = (newToToken: TokenSpec) => {
    setFromAndToTokens(fromToken, newToToken);
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
