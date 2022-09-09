import { useState } from "react";

import type { TokenConfig } from "../../config";
import { selectSwapTokenOptions } from "../../core/selectors/swapTokenOptions";
import { useEnvironment } from "../../core/store";
import type { TokenOption } from "../../models";

import { useToken } from "./useToken";

interface SwapTokensV2 {
  readonly fromTokenOption: TokenOption;
  readonly toTokenOption: TokenOption;
  readonly fromTokenConfig: TokenConfig;
  readonly toTokenConfig: TokenConfig;
  readonly setFromTokenOption: (fromToken: TokenOption) => void;
  readonly setToTokenOption: (toToken: TokenOption) => void;
  readonly fromTokenOptions: readonly TokenOption[];
  readonly toTokenOptions: readonly TokenOption[];
}

export const useSwapTokensV2 = (): SwapTokensV2 => {
  const tokenOptions = useEnvironment(selectSwapTokenOptions);

  const defaultFromToken = tokenOptions[0];
  const defaultToToken = tokenOptions[1];
  const [fromTokenOption, setFromTokenOption] = useState(defaultFromToken);
  const [toTokenOption, setToTokenOption] = useState(defaultToToken);

  const fromTokenConfig = useToken(fromTokenOption.tokenId);
  const toTokenConfig = useToken(toTokenOption.tokenId);

  return {
    fromTokenOption,
    toTokenOption,
    fromTokenConfig,
    toTokenConfig,
    setFromTokenOption,
    setToTokenOption,
    fromTokenOptions: tokenOptions,
    toTokenOptions: tokenOptions.filter(
      ({ tokenId, ecosystemId }) =>
        tokenId !== fromTokenOption.tokenId ||
        ecosystemId !== fromTokenOption.ecosystemId,
    ),
  };
};
