import { useState } from "react";

import type { TokenSpec } from "../../config";
import { selectTokenSpec } from "../../core/selectors";
import { selectSwapTokenOptions } from "../../core/selectors/swapTokenOptions";
import { useEnvironment } from "../../core/store";
import type { TokenOption } from "../../models";

interface SwapTokensV2 {
  readonly fromTokenOption: TokenOption;
  readonly toTokenOption: TokenOption;
  readonly fromTokenSpec: TokenSpec;
  readonly toTokenSpec: TokenSpec;
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

  const fromTokenSpec = useEnvironment(
    selectTokenSpec(fromTokenOption.tokenId),
  );
  const toTokenSpec = useEnvironment(selectTokenSpec(toTokenOption.tokenId));

  return {
    fromTokenOption,
    toTokenOption,
    fromTokenSpec,
    toTokenSpec,
    setFromTokenOption,
    setToTokenOption,
    fromTokenOptions: tokenOptions,
    toTokenOptions: tokenOptions.filter(
      ({ tokenId }) => tokenId !== fromTokenOption.tokenId,
    ),
  };
};
