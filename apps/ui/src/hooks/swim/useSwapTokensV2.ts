import { useState } from "react";

import type { TokenConfig } from "../../config";
import { selectSwapTokenOptions } from "../../core/selectors/swapTokenOptions";
import { useEnvironment } from "../../core/store";
import type { TokenOption } from "../../models";

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

  return {
    fromTokenOption,
    toTokenOption,
    fromTokenConfig: fromTokenOption.tokenConfig,
    toTokenConfig: toTokenOption.tokenConfig,
    setFromTokenOption,
    setToTokenOption,
    fromTokenOptions: tokenOptions,
    toTokenOptions: tokenOptions.filter(
      ({ tokenConfig, ecosystemId }) =>
        tokenConfig !== fromTokenOption.tokenConfig ||
        ecosystemId !== fromTokenOption.ecosystemId,
    ),
  };
};
