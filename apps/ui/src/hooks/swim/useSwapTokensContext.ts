import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";
import { useNavigate, useParams } from "react-router-dom";
import shallow from "zustand/shallow.js";

import type { TokenConfig } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

import {
  useFromTokenOptionsIds,
  useToTokenOptionsIds,
} from "./useSwapTokenOptions";

interface SwapTokensContext {
  readonly fromToken: TokenConfig;
  readonly toToken: TokenConfig;
  readonly fromTokenOptionsIds: readonly string[];
  readonly toTokenOptionsIds: readonly string[];
  readonly setFromToken: (newFromToken: TokenConfig) => void;
  readonly setToToken: (newToToken: TokenConfig) => void;
  readonly setFromAndToTokens: (
    newFromToken: TokenConfig,
    newToToken: TokenConfig,
  ) => void;
  readonly hasUrlError: boolean;
}

const convertTokenSpecToUrlParam = (token: TokenConfig): string =>
  `${token.nativeEcosystemId}-${
    TOKEN_PROJECTS_BY_ID[token.projectId].symbol
  }`.toLowerCase();

export const useSwapTokensContext = (): SwapTokensContext => {
  const navigate = useNavigate();
  const { tokens } = useEnvironment(selectConfig, shallow);
  const { fromToken: fromUrlParam, toToken: toUrlParam } = useParams<{
    readonly fromToken?: string;
    readonly toToken?: string;
  }>();

  const findTokenForParam = (param?: string): TokenConfig | null => {
    if (!param) {
      return null;
    }
    const [ecosystemId, projectSymbol] = param.split("-");
    return (
      tokens.find((token) => {
        return (
          TOKEN_PROJECTS_BY_ID[token.projectId].symbol.toLowerCase() ===
            projectSymbol &&
          token.nativeEcosystemId.toLowerCase() === ecosystemId
        );
      }) ?? null
    );
  };
  const fromTokenOptionsIds = useFromTokenOptionsIds();

  // TODO: Handle swimUSD as a swappable token
  const getToTokenOptionsIds = useToTokenOptionsIds();

  const defaultFromTokenId = fromTokenOptionsIds[0];

  const maybeFromToken = findTokenForParam(fromUrlParam);
  const hasFromUrlError = !!fromUrlParam && !maybeFromToken;

  const fromToken =
    maybeFromToken ??
    findOrThrow(tokens, ({ id }) => id === defaultFromTokenId);

  const toTokenOptionsIds = getToTokenOptionsIds(fromToken.id);

  const maybeToToken = findTokenForParam(toUrlParam);
  const hasToUrlError =
    !!toUrlParam &&
    (!maybeToToken || !toTokenOptionsIds.includes(maybeToToken.id));

  const toToken =
    maybeToToken && !hasToUrlError
      ? maybeToToken
      : findOrThrow(tokens, ({ id }) => id === toTokenOptionsIds[0]);

  const setFromAndToTokens = (
    newFromToken: TokenConfig,
    newToToken: TokenConfig,
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

  const setFromToken = (newFromToken: TokenConfig) => {
    setFromAndToTokens(newFromToken, toToken);
  };

  const setToToken = (newToToken: TokenConfig) => {
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
