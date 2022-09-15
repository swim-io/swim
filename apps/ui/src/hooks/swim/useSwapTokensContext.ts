import { TOKEN_PROJECTS_BY_ID } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shallow from "zustand/shallow.js";

import {
  Ecosystem,
  ECOSYSTEMS,
  ECOSYSTEM_LIST,
  TokenConfig,
} from "../../config";
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
  readonly fromNetwork: Ecosystem;
  readonly toNetwork: Ecosystem;
  readonly setFromNetwork: (networkId: string) => void;
  readonly setToNetwork: (networkId: string) => void;
  readonly setFromToken: (newFromToken: TokenConfig) => void;
  readonly setToToken: (newToToken: TokenConfig) => void;
  readonly setFromAndToTokens: (
    newFromToken: TokenConfig,
    newToToken: TokenConfig,
  ) => void;
  readonly hasUrlError: boolean;
}

interface TokenAndNetwork {
  token: TokenConfig;
  network: Ecosystem;
}

const findSwapDataFromParams = (
  tokens: readonly TokenConfig[],
  param?: string,
): TokenAndNetwork | null => {
  if (!param) {
    return null;
  }
  const [ecosystemId, projectSymbol] = param.split("-");
  const network: Ecosystem =
    ECOSYSTEM_LIST.find((ecosystem) => ecosystem.id === ecosystemId) ??
    ECOSYSTEMS.solana;
  const token =
    tokens.find(
      (token) =>
        TOKEN_PROJECTS_BY_ID[token.projectId].symbol.toLowerCase() ===
          projectSymbol && token.nativeEcosystemId.toLowerCase() === network.id,
    ) ?? tokens.filter((token) => token.nativeEcosystemId === network.id)[0];

  return {
    token,
    network,
  };
};

const convertTokenConfigToUrlParam = (token: TokenConfig): string =>
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

  // TODO: Handle swimUSD as a swappable token
  const getToTokenOptionsIds = useToTokenOptionsIds();
  const fromData = findSwapDataFromParams(tokens, fromUrlParam);
  const toData = findSwapDataFromParams(tokens, toUrlParam);

  const [networks, setNetworks] = useState<Ecosystem[]>([
    fromData?.network ?? ECOSYSTEMS.solana,
    toData?.network ?? ECOSYSTEMS.solana,
  ]);

  const [fromTokenOptionsIds, setFromTokensOptionIds] = useState<
    readonly string[]
  >(
    useFromTokenOptionsIds(networks[0].id).filter((tokenId) =>
      tokenId.includes(networks[0].id),
    ),
  );
  const hasFromUrlError = !!fromUrlParam && !fromData?.token;
  const fromToken =
    fromData?.token ??
    findOrThrow(tokens, ({ id }) => id === fromTokenOptionsIds[0]);

  const [toTokenOptionsIds, setToTokensOptionIds] = useState<readonly string[]>(
    getToTokenOptionsIds(fromToken.id).filter((toeknId) =>
      toeknId.includes(networks[1].id),
    ),
  );
  const hasToUrlError =
    !!toUrlParam && (!toData || !toTokenOptionsIds.includes(toData.token.id));

  const toToken =
    toData?.token && !hasToUrlError
      ? toData.token
      : findOrThrow(tokens, ({ id }) => id === toTokenOptionsIds[0]);

  const [fromTokenConfig, setFromTokenConfig] =
    useState<TokenConfig>(fromToken);
  const [toTokenConfig, setToTokenConfig] = useState<TokenConfig>(toToken);

  const setFromAndToTokens = (
    newFromToken: TokenConfig,
    newToToken: TokenConfig,
  ) => {
    const fromTokenUrlParam = convertTokenConfigToUrlParam(newFromToken);
    const newToTokenOptions = getToTokenOptionsIds(newFromToken.id);
    const toTokenUrlParam = convertTokenConfigToUrlParam(
      newToTokenOptions.find((id) => id === newToToken.id)
        ? newToToken
        : findOrThrow(tokens, ({ id }) => id === newToTokenOptions[0]),
    );
    setFromTokenConfig(newFromToken);
    setToTokenConfig(newToToken);
    navigate(`/swap/${fromTokenUrlParam}/to/${toTokenUrlParam}`);
  };

  const setFromToken = (newFromToken: TokenConfig) => {
    setFromAndToTokens(newFromToken, toToken);
  };

  const setToToken = (newToToken: TokenConfig) => {
    setFromAndToTokens(fromToken, newToToken);
  };

  const setFromNetwork = (networkId: string) => {
    const updatedNetworks: Ecosystem[] = [...networks];
    updatedNetworks[0] =
      ECOSYSTEM_LIST.find(({ id }) => id === networkId) ?? ECOSYSTEMS.solana;
    const fromTokens = tokens.filter(
      (token) =>
        token.nativeEcosystemId === updatedNetworks[0].id && !token.isDisabled,
    );
    const tokenIds = fromTokens.map((token) => token.id);

    setFromTokenConfig(fromTokens[0]);
    setFromTokensOptionIds(tokenIds);
    setNetworks(updatedNetworks);
  };

  const setToNetwork = (networkId: string) => {
    const updatedNetworks: Ecosystem[] = [...networks];
    updatedNetworks[1] =
      ECOSYSTEM_LIST.find(({ id }) => id === networkId) ?? ECOSYSTEMS.solana;
    const toTokens = tokens.filter(
      (token) =>
        token.nativeEcosystemId === updatedNetworks[1].id && !token.isDisabled,
    );
    const tokenIds = toTokens.map((token) => token.id);

    setToTokenConfig(toTokens[0]);
    setToTokensOptionIds(tokenIds);
    setNetworks(updatedNetworks);
  };

  const hasUrlError = hasToUrlError || hasFromUrlError;
  return {
    fromToken: fromTokenConfig,
    toToken: toTokenConfig,
    fromTokenOptionsIds,
    toTokenOptionsIds,
    fromNetwork: networks[0],
    toNetwork: networks[1],
    setFromNetwork,
    setToNetwork,
    setFromToken,
    setToToken,
    setFromAndToTokens,
    hasUrlError,
  };
};
